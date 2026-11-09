import {createHash,createDecipheriv} from "node:crypto";
import {createReadStream} from "node:fs";
import {readFile,lstat,mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawn} from "node:child_process";
import {Transform} from "node:stream";
import {pipeline} from "node:stream/promises";
import {Client} from "pg";
import {inspectBackup} from "./verification";
import {unseal,recoverKey,type RecoveryEnvelope} from "./crypto";
import {scanDocuments,type BackupComponent} from "./files";
import {validateSandboxTarget} from "./restore-sandbox-policy";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type DocumentPart=BackupComponent&{sourceName:string};
type Manifest={version:2;id:string;schemaVersion:number;postgresVersion:string;
 database:BackupComponent;documents:DocumentPart[]};
export type RehearsalResult={
 archiveId:string;status:"reconstructed-in-sandbox"|"incomplete-archive-scope";
 sandboxOnly:true;restoredTables:number;verifiedDocuments:number;
 missingDocumentReferences:number;archiveHashChecked:true;
 databaseAndDocumentsConsistent:boolean;activeInstallationModified:false;
};
function executable():string{
 if(process.env.SMN_PG_RESTORE_PATH)return process.env.SMN_PG_RESTORE_PATH;
 if(process.platform==="win32"){
  const root=process.env.LOCALAPPDATA;
  if(root)return join(root,"ScrumMasterNotebook","pgsql","bin","pg_restore.exe");
  throw Error("pg-restore-unavailable");
 }
 return "pg_restore";
}
function metadata(value:unknown):Manifest{
 if(!value||typeof value!=="object")throw Error("manifest-invalid");
 const m=value as Partial<Manifest>;
 if(m.version!==2||!UUID.test(m.id??"")||!m.database||
  !Array.isArray(m.documents)||m.documents.length>2000)
  throw Error("manifest-invalid");
 return m as Manifest;
}
async function decryptComponent(path:string,part:BackupComponent,key:Buffer):Promise<Buffer>{
 if(part.size>12*1024*1024)throw Error("document-too-large");
 const bytes=await readFile(path);
 if(bytes.length!==part.encryptedSize||
  createHash("sha256").update(bytes).digest("hex")!==part.encryptedSha256)
  throw Error("ciphertext-invalid");
 const content=unseal(key,{ciphertext:bytes,nonce:part.nonce,tag:part.tag});
 if(content.length!==part.size||
  createHash("sha256").update(content).digest("hex")!==part.sha256)
  throw Error("plaintext-invalid");
 return content;
}
function newPgRestore(target:string,timeout:AbortSignal){
 const uri=new URL(target);
 return spawn(executable(),["--exit-on-error","--single-transaction","--no-owner",
  "--no-acl","--no-password","--dbname",decodeURIComponent(uri.pathname.slice(1)),
  "--host",uri.hostname,"--port",uri.port||"5432",
  "--username",decodeURIComponent(uri.username)],{
  windowsHide:true,stdio:["pipe","ignore","pipe"],signal:timeout,
  env:{...process.env,PGPASSWORD:decodeURIComponent(uri.password)}
 });
}
/**
 * Sandbox ONLY. Never accepts an arbitrary database or creates/drops one.
 * The caller must pre-create a truly empty throwaway PostgreSQL database.
 * No pg_dump plaintext is ever written to disk; pg_restore receives AES-GCM
 * authenticated plaintext over stdin and uses a single SQL transaction.
 */
export async function rehearseBackupRestore(options:{
 sourceUri:string;sandboxUri:string;backupRoot:string;archiveId:string;
}):Promise<RehearsalResult>{
 const {sourceUri,sandboxUri,backupRoot,archiveId}=options;
 if(!validateSandboxTarget(sourceUri,sandboxUri)||!UUID.test(archiveId))
  throw Error("restore-sandbox-denied");
 const sandbox=new Client({connectionString:sandboxUri,
  application_name:"smn34-sandbox-only",connectionTimeoutMillis:3500,
  statement_timeout:20000});
 const packageDir=join(backupRoot,"packages",archiveId);
 const keyPath=join(backupRoot,".backup-key");
 let key:Buffer|null=null,staging:string|null=null;
 try{
  await sandbox.connect();
  const tables=await sandbox.query<{n:string}>(`
   SELECT count(*)::text AS n FROM pg_catalog.pg_class c
   JOIN pg_catalog.pg_namespace ns ON ns.oid=c.relnamespace
   WHERE ns.nspname='public' AND c.relkind IN ('r','p','v','m','f')`);
  if(tables.rows[0]?.n!=="0")throw Error("sandbox-not-empty");
  const keyInfo=await lstat(keyPath).catch(()=>null);
  if(keyInfo){
   if(!keyInfo.isFile()||keyInfo.isSymbolicLink()||keyInfo.size!==32)
    throw Error("restore-key-invalid");
   key=await readFile(keyPath);
  }else{
   const phrase=process.env.SMN_BACKUP_RECOVERY_PHRASE;
   if(!phrase||phrase.length<20||phrase.length>256)
    throw Error("restore-key-or-recovery-phrase-required");
   const index=JSON.parse(await readFile(join(packageDir,"index.json"),"utf8")) as
    {recovery:RecoveryEnvelope};
   key=recoverKey(index.recovery,phrase);
  }
  const verified=await inspectBackup(backupRoot,archiveId,key);
  if(verified.status!=="verified"||!verified.integrityVerified)
   throw Error("restore-archive-unverified");
  const rawIndex=JSON.parse(await readFile(join(packageDir,"index.json"),"utf8")) as {
   encryptedManifest:Omit<BackupComponent,"path">};
  const manifestBytes=await decryptComponent(join(packageDir,"manifest.enc"),
   {...rawIndex.encryptedManifest,path:"manifest.enc"},key);
  let manifest:Manifest;
  try{manifest=metadata(JSON.parse(manifestBytes.toString("utf8")));}
  finally{manifestBytes.fill(0);}
  if(manifest.id!==archiveId||verified.schemaVersion!==manifest.schemaVersion||
   verified.postgresVersion!==manifest.postgresVersion)
   throw Error("restore-manifest-inconsistent");
  const source=join(packageDir,"database.pgcustom.enc");
  staging=await mkdtemp(join(tmpdir(),"smn34-sandbox-"));
  const docs=join(staging,"documents");
  await mkdir(docs,{mode:0o700});
  for(const part of manifest.documents){
   if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}\.(?:meta\.json|txt|pdf)$/.test(part.sourceName))
    throw Error("restore-document-name-invalid");
   const bytes=await decryptComponent(join(packageDir,part.path),part,key);
   try{await writeFile(join(docs,part.sourceName),bytes,{flag:"wx",mode:0o600});}
   finally{bytes.fill(0);}
  }
  const inventory=await scanDocuments(docs);
  if(inventory.length!==manifest.documents.length)
   throw Error("restore-document-inventory-mismatch");
  // Verify the installed major version of the isolated database before replay.
  const version=await sandbox.query<{major:string}>(`
   SELECT current_setting('server_version') AS major`);
  if(!version.rows[0]?.major.startsWith("18.")||
   manifest.postgresVersion.split(".")[0]!=="18")
   throw Error("restore-postgres-incompatible");
  const child=newPgRestore(sandboxUri,AbortSignal.timeout(15*60_000));
  child.stderr?.resume();
  const exited=new Promise<void>((resolve,reject)=>{
   child.once("error",()=>reject(Error("pg-restore-unavailable")));
   child.once("close",code=>code===0?resolve():reject(Error("pg-restore-failed")));
  });
  const plainHash=createHash("sha256");let length=0;
  const tally=new Transform({transform(chunk:Buffer,_encoding,cb){
   length+=chunk.length;plainHash.update(chunk);
   if(length>8*1024*1024*1024){cb(Error("database-too-large"));return;}
   cb(null,chunk);
  }});
  const decipher=createDecipheriv("aes-256-gcm",key,
   Buffer.from(manifest.database.nonce,"hex"));
  decipher.setAuthTag(Buffer.from(manifest.database.tag,"hex"));
  try{
   await Promise.all([
    pipeline(createReadStream(source),decipher,tally,child.stdin!),
    exited
   ]);
  }catch{
   child.kill();
   throw Error("restore-rehearsal-failed");
  }
  if(length!==manifest.database.size||
   plainHash.digest("hex")!==manifest.database.sha256)
   throw Error("restore-database-hash-mismatch");
  const installed=await sandbox.query<{schema_version:number}>(`
   SELECT schema_version FROM public.smn_installation WHERE id='singleton'
   AND state='initialized'`);
  if(installed.rowCount!==1||installed.rows[0].schema_version!==manifest.schemaVersion)
   throw Error("restore-schema-mismatch");
  const foreign=await sandbox.query<{n:string}>(`
   SELECT count(*)::text AS n FROM pg_catalog.pg_constraint
   WHERE contype='f' AND convalidated=false`);
  if(foreign.rows[0]?.n!=="0")throw Error("restore-constraints-unvalidated");
  // Current backup format includes SMN_PRIVATE_DOCUMENTS_DIR only.
  // Generated PDF archives are stored elsewhere and are NOT in this package.
  // Therefore any archived PDF reference makes a "complete restore" claim false.
  const missingRefs=await sandbox.query<{n:string}>(`
   SELECT count(*)::text AS n FROM public.smn_report_pdf_archive`);
  const missing=Number(missingRefs.rows[0]?.n);
  if(!Number.isSafeInteger(missing)||missing<0)
   throw Error("restore-document-references-unverified");
  const count=await sandbox.query<{n:string}>(`
   SELECT count(*)::text AS n FROM pg_catalog.pg_class c
   JOIN pg_catalog.pg_namespace ns ON ns.oid=c.relnamespace
   WHERE ns.nspname='public' AND c.relkind='r'`);
  return {archiveId,status:missing===0?"reconstructed-in-sandbox":
   "incomplete-archive-scope",sandboxOnly:true,
   restoredTables:Number(count.rows[0]?.n),verifiedDocuments:inventory.length/2,
   missingDocumentReferences:missing,archiveHashChecked:true,
   databaseAndDocumentsConsistent:missing===0,activeInstallationModified:false};
 }finally{
  key?.fill(0);
  await sandbox.end().catch(()=>undefined);
  if(staging)await rm(staging,{recursive:true,force:true}).catch(()=>undefined);
 }
}
