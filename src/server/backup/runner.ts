import {randomBytes,randomUUID} from "node:crypto";
import {lstat,mkdir,readFile,readdir,rename,rm,writeFile} from "node:fs/promises";
import {join,isAbsolute,resolve,sep} from "node:path";
import {Client} from "pg";
import appPackage from "../../../package.json";
import {installedDatabaseUri} from "../auth/database";
import {ensureAccountsSchema} from "../accounts/migration";
import {verifyPassword} from "../auth/password";
import {seal,wrapRecoveryKey,recoverKey,type RecoveryEnvelope} from "./crypto";
import {privateFolder,scanDocuments,encryptDocuments,sha,safeAtomicJson,
 type PublicBackupResult,type BackupIndex,type BackupComponent} from "./files";
import {encryptedPgDump} from "./postgres";
import {inspectExtraArchives,encryptExtraArchives,pdfArchiveDirectory}
 from "./extra-archives";
import {officeReportsDirectory} from "../reports/office-storage";
import {officeTemplatesDirectory} from "../reports/office-catalog";
import {captureFenceUnchanged} from "./capture-fence";
import {safeBackupFailureStage,type BackupFailureStage} from "./failure-stage";

type Admin=Readonly<{id:string;role:string;password_hash:string}>;
export type BackupState=Readonly<{
 needsRecoveryPhrase:boolean;last:Readonly<{status:"running"|"success"|"failed"|"cancelled";id?:string;createdAt:string;failureStage?:string}>|null;
}>;
export function backupRootPath():string{
 const custom=process.env.SMN_BACKUP_DIR;
 if(custom){
  if(!isAbsolute(custom))throw new Error("backup-root-invalid");
  return resolve(custom);
 }
 if(process.platform!=="win32"||!process.env.LOCALAPPDATA)
  throw new Error("backup-root-unconfigured");
 return join(process.env.LOCALAPPDATA,"ScrumMasterNotebook","backups");
}
function sameOrNested(a:string,b:string):boolean{
 const first=resolve(a).toLowerCase(),second=resolve(b).toLowerCase();
 return first===second||first.startsWith(second+sep)||second.startsWith(first+sep);
}
async function loadKey(root:string):Promise<{key:Buffer;recovery:RecoveryEnvelope}|null>{
 const keyFile=join(root,".backup-key"),recoveryFile=join(root,".recovery.json");
 const details=await Promise.all([lstat(keyFile).catch(()=>null),lstat(recoveryFile).catch(()=>null)]);
 if(!details[0]&&!details[1])return null;
 if(!details[0]||!details[1]||details.some(x=>!x?.isFile()||x.isSymbolicLink()))
  throw new Error("backup-key-incomplete");
 const key=await readFile(keyFile);
 if(key.length!==32)throw new Error("backup-key-invalid");
 const recovery=JSON.parse((await readFile(recoveryFile)).toString("utf8")) as RecoveryEnvelope;
 if(!recovery||recovery.version!==1||recovery.kdf!=="scrypt"||
 !/^[a-f0-9]{32}$/.test(recovery.salt)||!/^[a-f0-9]{24}$/.test(recovery.nonce)||
 !/^[a-f0-9]{32}$/.test(recovery.tag)||
 typeof recovery.wrappedKey!=="string"||!/^[a-f0-9]{64}$/.test(recovery.wrappedKey))
  throw new Error("backup-recovery-invalid");
 return {key,recovery};
}
async function getOrCreateKey(root:string,phrase:string|undefined,passwordHash:string){
 const existing=await loadKey(root);
 if(existing)return existing;
 const packages=await readdir(join(root,"packages")).catch((error:unknown)=>{
  if(error&&typeof error==="object"&&"code" in error&&error.code==="ENOENT")return [] as string[];
  throw new Error("backup-packages-unavailable");
 });
 if(packages.some(name=>!name.startsWith(".")))
  throw new Error("backup-key-missing-for-existing-archives");
 if(!phrase||phrase.length<20||phrase.length>256||phrase.trim()!==phrase||
 await verifyPassword(phrase,passwordHash))throw new Error("backup-recovery-required");
 const key=randomBytes(32),recovery=wrapRecoveryKey(key,phrase);
 const verified=recoverKey(recovery,phrase);
 if(!verified.equals(key))throw new Error("backup-recovery-invalid");
 verified.fill(0);
 const keyPath=join(root,".backup-key"),recoveryPath=join(root,".recovery.json");
 let madeKey=false;
 try{
  await writeFile(keyPath,key,{flag:"wx",mode:0o600});
  madeKey=true;
  await writeFile(recoveryPath,JSON.stringify(recovery),{flag:"wx",mode:0o600});
  return {key,recovery};
 }catch{
  if(madeKey)await rm(keyPath,{force:true}).catch(()=>undefined);
  await rm(recoveryPath,{force:true}).catch(()=>undefined);
  throw new Error("backup-key-unavailable");
 }
}
async function readLast(root:string):Promise<BackupState["last"]>{
 try{
  const data=JSON.parse((await readFile(join(root,"last-attempt.json"))).toString("utf8")) as Record<string,unknown>;
  if(typeof data.status!=="string"||
   !["running","success","failed","cancelled"].includes(data.status)||
   typeof data.createdAt!=="string")return null;
  const status=data.status as "running"|"success"|"failed"|"cancelled";
  return {status,id:typeof data.id==="string"?data.id:undefined,createdAt:data.createdAt,
   ...(status==="failed"&&typeof data.failureStage==="string"?
    {failureStage:safeBackupFailureStage(data.failureStage)}:{})};
 }catch{return null;}
}
export async function backupState():Promise<BackupState>{
 const root=backupRootPath();
 try{await privateFolder(root);}catch{return {needsRecoveryPhrase:true,last:null};}
 let hasKey=false;
 try{hasKey=(await loadKey(root))!==null;}catch{/* Inventaire accessible même si la clé locale est endommagée. */}
 return {needsRecoveryPhrase:!hasKey,last:await readLast(root)};
}
/** Publication atomique : un répertoire .partial n'est jamais une sauvegarde réussie. */
export async function createManualBackup(actor:Admin,phrase?:string):Promise<PublicBackupResult>{
 if(actor.role!=="admin")throw new Error("backup-forbidden");
 const root=backupRootPath();
 await privateFolder(root,true);
 const source=process.env.SMN_PRIVATE_DOCUMENTS_DIR;
 if(source&&sameOrNested(root,source))throw new Error("backup-root-overlaps-documents");
 for(const folder of [pdfArchiveDirectory(),officeReportsDirectory(),officeTemplatesDirectory()])
  if(sameOrNested(root,folder)||source&&sameOrNested(source,folder))
   throw new Error("backup-root-overlaps-extra-archives");
 const uri=await installedDatabaseUri();
 const client=new Client({connectionString:uri,application_name:"smn-manual-backup",
  connectionTimeoutMillis:3500,statement_timeout:10000,query_timeout:10000});
 const id=randomUUID(),createdAt=new Date().toISOString(),packages=join(root,"packages");
 let locked=false,staging="";
 let failureStage:BackupFailureStage="connection";
 try{
  await client.connect();
  failureStage="schema-check";
  await ensureAccountsSchema(client);
  failureStage="advisory-lock";
  const acquired=await client.query<{acquired:boolean}>(
   "SELECT pg_try_advisory_lock(20261021,30) AS acquired");
  if(acquired.rows[0]?.acquired!==true)throw new Error("backup-already-running");
  locked=true;
  // Persist intent before touching any component; a crash leaves 'running',
  // reconciled on the next read using the actual advisory lock and package.
  failureStage="record-start";
  await safeAtomicJson(join(root,"last-attempt.json"),{
   status:"running",id,createdAt
  });
  failureStage="encryption-key";
  const {key,recovery}=await getOrCreateKey(root,phrase,actor.password_hash);
  try{
   failureStage="private-documents";
   const inventory=await scanDocuments(source);
   failureStage="office-pdf-inventory";
   const extras=await inspectExtraArchives(client);
   failureStage="staging";
   await privateFolder(packages,true);
   staging=join(packages,"."+id+".partial");
   await mkdir(staging,{mode:0o700});
   failureStage="installation-metadata";
   const meta=await client.query<{schema_version:number;pg_version:string;installation_created_at:Date}>(`
    SELECT i.schema_version,i.created_at AS installation_created_at,
           current_setting('server_version') AS pg_version
    FROM public.smn_installation i WHERE i.id='singleton' AND i.state='initialized'`);
   if(meta.rowCount!==1)throw new Error("backup-installation-invalid");
   // A conservative consistency fence: reject any PostgreSQL WAL activity
   // between dump start and final file verification, even if unrelated.
   failureStage="wal-start";
   const begin=await client.query<{lsn:string}>("SELECT pg_current_wal_lsn()::text AS lsn");
   if(!begin.rows[0]?.lsn)throw Error("backup-wal-unavailable");
   failureStage="pg-dump";
   const database=await encryptedPgDump(uri,key,join(staging,"database.pgcustom.enc"));
   failureStage="document-encryption";
   const documents=await encryptDocuments(source,inventory,join(staging,"documents"),key);
   failureStage="archive-encryption";
   const archiveFiles=await encryptExtraArchives(extras,key,staging);
   failureStage="source-recheck";
   const after=await scanDocuments(source);
   if(JSON.stringify(inventory)!==JSON.stringify(after))
    throw new Error("backup-documents-changed");
   if(JSON.stringify(extras)!==JSON.stringify(await inspectExtraArchives(client)))
    throw new Error("backup-extra-archives-changed");
   failureStage="wal-consistency";
   const end=await client.query<{lsn:string}>("SELECT pg_current_wal_lsn()::text AS lsn");
   if(!captureFenceUnchanged({walLsn:begin.rows[0].lsn,documents:inventory,archives:extras},
    {walLsn:end.rows[0]?.lsn??"",documents:after,archives:await inspectExtraArchives(client)}))
    throw Error("backup-database-changed-during-capture");
   const manifest={version:4,id,createdAt,installation:"singleton",
    installationSource:"singleton:"+new Date(meta.rows[0].installation_created_at).toISOString(),
    appVersion:appPackage.version,
    schemaVersion:meta.rows[0].schema_version,postgresVersion:meta.rows[0].pg_version,
    database,documents:inventory.map((document,index)=>({
     sourceName:document.name,...documents[index],
    })),reportPdfs:archiveFiles.pdf,officeReports:archiveFiles.office,
    officeTemplates:archiveFiles.templates,
    consistency:{method:"wal-fence-v1",walLsn:begin.rows[0].lsn}};
   failureStage="manifest-encryption";
   const sealed=seal(key,Buffer.from(JSON.stringify(manifest),"utf8"));
   await writeFile(join(staging,"manifest.enc"),sealed.ciphertext,{flag:"wx",mode:0o600});
   const encryptedManifest:Omit<BackupComponent,"path">={
    sha256:sha(Buffer.from(JSON.stringify(manifest))),size:Buffer.byteLength(JSON.stringify(manifest)),
    encryptedSha256:sha(sealed.ciphertext),encryptedSize:sealed.ciphertext.length,
    nonce:sealed.nonce,tag:sealed.tag,
   };
   const index:BackupIndex={version:1,id,createdAt,encryptedManifest,recovery};
   await writeFile(join(staging,"index.json"),JSON.stringify(index),{flag:"wx",mode:0o600});
   // Final conservative fence immediately before publication. This cannot
   // make external file writes transactional, but prevents known drift.
   failureStage="publication-fence";
   const finalDocs=await scanDocuments(source);
   const finalArchives=await inspectExtraArchives(client);
   const finalWal=await client.query<{lsn:string}>(
    "SELECT pg_current_wal_lsn()::text AS lsn");
   if(!captureFenceUnchanged({walLsn:begin.rows[0].lsn,documents:inventory,archives:extras},
    {walLsn:finalWal.rows[0]?.lsn??"",documents:finalDocs,archives:finalArchives}))
    throw Error("backup-scope-changed-before-publication");
   failureStage="publish";
   await rename(staging,join(packages,id));
   staging="";
   // Après la publication atomique, une panne du fichier de statut ne doit pas
   // faire passer un paquet complet pour un échec de capture.
   await safeAtomicJson(join(root,"last-attempt.json"),{status:"success",id,createdAt})
    .catch(()=>undefined);
   return {id,createdAt,status:"success",documentCount:inventory.length/2};
  }finally{key.fill(0);}
 }catch(error){
  if(locked)await safeAtomicJson(join(root,"last-attempt.json"),{
   status:"failed",id,createdAt,failureStage:safeBackupFailureStage(failureStage)
  }).catch(()=>undefined);
  // Diagnostic opt-in for disposable CI only. Never leak arbitrary SQL,
  // paths, exception messages, credentials or user content.
  if(process.env.SMN_BACKUP_TEST_DIAGNOSTIC==="1"){
   const code=error instanceof Error?error.message:"unknown";
   const allowed=new Set(["backup-db-changed-during-capture",
    "extra-archive-template-invalid","extra-archive-template-unrecognized",
    "extra-archive-office-unrecognized","extra-archive-pdf-integrity",
    "extra-archive-pdf-orphan-or-missing","extra-archive-pdf-mismatch",
    "backup-document-invalid","backup-document-inconsistent",
    "backup-pg-dump-failed","backup-extra-archives-changed",
    "backup-documents-changed","backup-wal-unavailable"]);
   throw new Error("backup-failed:"+(allowed.has(code)?code:"unclassified"));
  }
  throw new Error("backup-failed");
 }finally{
  if(staging)await rm(staging,{recursive:true,force:true}).catch(()=>undefined);
  if(locked)await client.query("SELECT pg_advisory_unlock(20261021,30)").catch(()=>undefined);
  await client.end().catch(()=>undefined);
 }
}
