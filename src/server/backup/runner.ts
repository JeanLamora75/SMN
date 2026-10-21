import {randomBytes,randomUUID} from "node:crypto";
import {lstat,mkdir,readFile,rename,rm,writeFile} from "node:fs/promises";
import {join,isAbsolute,resolve,sep} from "node:path";
import {Client} from "pg";
import {installedDatabaseUri} from "../auth/database";
import {ensureAccountsSchema} from "../accounts/migration";
import {verifyPassword} from "../auth/password";
import {seal,wrapRecoveryKey,type RecoveryEnvelope} from "./crypto";
import {privateFolder,scanDocuments,encryptDocuments,sha,safeAtomicJson,
 type PublicBackupResult,type BackupIndex,type BackupComponent} from "./files";
import {encryptedPgDump} from "./postgres";

type Admin=Readonly<{id:string;role:string;password_hash:string}>;
export type BackupState=Readonly<{
 needsRecoveryPhrase:boolean;last:Readonly<{status:"success"|"failed";id?:string;createdAt:string}>|null;
}>;
function rootPath():string{
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
 typeof recovery.wrappedKey!=="string"||!/^[a-f0-9]{64}$/.test(recovery.wrappedKey))
  throw new Error("backup-recovery-invalid");
 return {key,recovery};
}
async function getOrCreateKey(root:string,phrase:string|undefined,passwordHash:string){
 const existing=await loadKey(root);
 if(existing)return existing;
 if(!phrase||phrase.length<20||phrase.length>256||phrase.trim()!==phrase||
 await verifyPassword(phrase,passwordHash))throw new Error("backup-recovery-required");
 const key=randomBytes(32),recovery=wrapRecoveryKey(key,phrase);
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
  if((data.status!=="success"&&data.status!=="failed")||typeof data.createdAt!=="string")return null;
  return {status:data.status,id:typeof data.id==="string"?data.id:undefined,createdAt:data.createdAt};
 }catch{return null;}
}
export async function backupState():Promise<BackupState>{
 const root=rootPath();
 try{await privateFolder(root);}catch{return {needsRecoveryPhrase:true,last:null};}
 const key=await loadKey(root);
 return {needsRecoveryPhrase:key===null,last:await readLast(root)};
}
/** Publication atomique : un répertoire .partial n'est jamais une sauvegarde réussie. */
export async function createManualBackup(actor:Admin,phrase?:string):Promise<PublicBackupResult>{
 if(actor.role!=="admin")throw new Error("backup-forbidden");
 const root=rootPath();
 await privateFolder(root,true);
 const source=process.env.SMN_PRIVATE_DOCUMENTS_DIR;
 if(source&&sameOrNested(root,source))throw new Error("backup-root-overlaps-documents");
 const uri=await installedDatabaseUri();
 const client=new Client({connectionString:uri,application_name:"smn-manual-backup",
  connectionTimeoutMillis:3500,statement_timeout:10000,query_timeout:10000});
 const id=randomUUID(),createdAt=new Date().toISOString(),packages=join(root,"packages");
 let locked=false,staging="";
 try{
  await client.connect();
  await ensureAccountsSchema(client);
  const acquired=await client.query<{acquired:boolean}>(
   "SELECT pg_try_advisory_lock(20261021,30) AS acquired");
  if(acquired.rows[0]?.acquired!==true)throw new Error("backup-already-running");
  locked=true;
  const {key,recovery}=await getOrCreateKey(root,phrase,actor.password_hash);
  try{
   const inventory=await scanDocuments(source);
   await privateFolder(packages,true);
   staging=join(packages,"."+id+".partial");
   await mkdir(staging,{mode:0o700});
   const meta=await client.query<{schema_version:number;pg_version:string}>(`
    SELECT i.schema_version,current_setting('server_version') AS pg_version
    FROM public.smn_installation i WHERE i.id='singleton' AND i.state='initialized'`);
   if(meta.rowCount!==1)throw new Error("backup-installation-invalid");
   const database=await encryptedPgDump(uri,key,join(staging,"database.pgcustom.enc"));
   const documents=await encryptDocuments(source,inventory,join(staging,"documents"),key);
   const after=await scanDocuments(source);
   if(JSON.stringify(inventory)!==JSON.stringify(after))
    throw new Error("backup-documents-changed");
   const manifest={version:1,id,createdAt,installation:"singleton",
    schemaVersion:meta.rows[0].schema_version,postgresVersion:meta.rows[0].pg_version,
    database,documents:inventory.map((document,index)=>({
     sourceName:document.name,...documents[index],
    }))};
   const sealed=seal(key,Buffer.from(JSON.stringify(manifest),"utf8"));
   await writeFile(join(staging,"manifest.enc"),sealed.ciphertext,{flag:"wx",mode:0o600});
   const encryptedManifest:Omit<BackupComponent,"path">={
    sha256:sha(Buffer.from(JSON.stringify(manifest))),size:Buffer.byteLength(JSON.stringify(manifest)),
    encryptedSha256:sha(sealed.ciphertext),encryptedSize:sealed.ciphertext.length,
    nonce:sealed.nonce,tag:sealed.tag,
   };
   const index:BackupIndex={version:1,id,createdAt,encryptedManifest,recovery};
   await writeFile(join(staging,"index.json"),JSON.stringify(index),{flag:"wx",mode:0o600});
   await rename(staging,join(packages,id));
   staging="";
   // Après la publication atomique, une panne du fichier de statut ne doit pas
   // faire passer un paquet complet pour un échec de capture.
   await safeAtomicJson(join(root,"last-attempt.json"),{status:"success",id,createdAt})
    .catch(()=>undefined);
   return {id,createdAt,status:"success",documentCount:inventory.length/2};
  }finally{key.fill(0);}
 }catch{
  await safeAtomicJson(join(root,"last-attempt.json"),{status:"failed",createdAt})
   .catch(()=>undefined);
  throw new Error("backup-failed");
 }finally{
  if(staging)await rm(staging,{recursive:true,force:true}).catch(()=>undefined);
  if(locked)await client.query("SELECT pg_advisory_unlock(20261021,30)").catch(()=>undefined);
  await client.end().catch(()=>undefined);
 }
}
