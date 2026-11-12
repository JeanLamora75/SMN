import {open,lstat,readFile,rename} from "node:fs/promises";
import {join,dirname,resolve} from "node:path";
import {Client} from "pg";
import {backupRootPath} from "./runner";
import {readFreshCutoverJournal,freshCutoverMac} from "./fresh-cutover-journal";
import {existingManagedUri} from "../bootstrap/portable";
import {inspectOfflineCutoverJournal}
 from "../../../scripts/smn-40-cutover-postcheck";

/** Compensating rollback AFTER a verified cutover. No data deletion.
 * Retains both database generations, original and candidate folders and
 * the external maintenance fence. A mid-operation incident requires manual
 * recovery; it never releases users into an ambiguous database.
 */
export async function rollbackVerifiedNewComputerCutover(
 journalPath:string,receiptPath:string
){
 if(process.platform!=="win32"||
  process.env.SMN_DATABASE_URL||
  process.env.SMN40_ROLLBACK_OFFLINE_CONFIRM!==
   "ROLLBACK_VERIFIED_NEWPC_CUTOVER")
  throw Error("migration-rollback-not-enabled");
 await inspectOfflineCutoverJournal(journalPath,receiptPath);
 const keyPath=join(backupRootPath(),".backup-key");
 const ki=await lstat(keyPath);
 if(!ki.isFile()||ki.isSymbolicLink()||ki.size!==32)
  throw Error("migration-rollback-key-invalid");
 const key=await readFile(keyPath);
 const groups=[
  join(process.cwd(),"data","documents"),
  join(process.cwd(),".smn-private","report-archives"),
  join(process.cwd(),"data","office","reports"),
  join(process.cwd(),"data","office","templates")
 ];
 let admin:Client|null=null;
 let locked=false;
 try{
  const events=await readFreshCutoverJournal(journalPath,key);
  const last=events.at(-1);
  if(last?.stage!=="verified")
   throw Error("migration-rollback-already-started-or-invalid");
  const parent=await lstat(dirname(journalPath));
  if(!parent.isDirectory()||parent.isSymbolicLink()||
    resolve(dirname(journalPath))!==
     resolve(join(process.cwd(),"data","migration-audit")))
    throw Error("migration-rollback-journal-directory-invalid");
  for(const active of groups){
   const old=active+".smn-newpc-rollback-"+last.id;
   const candidate=active+".smn-newpc-prepared-"+last.id;
   for(const folder of [active,old]){
    const st=await lstat(folder);
    if(!st.isDirectory()||st.isSymbolicLink())
     throw Error("migration-rollback-files-untrusted");
   }
   try{await lstat(candidate);throw Error("migration-rollback-slot-occupied");}
   catch(e){
    if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;
   }
  }
  const uri=await existingManagedUri();
  if(!uri)throw Error("migration-rollback-cluster-unavailable");
  const maintenance=new URL(uri);maintenance.pathname="/postgres";
  admin=new Client({connectionString:maintenance.toString(),
   connectionTimeoutMillis:3500,statement_timeout:12000});
  await admin.connect();
  const lock=await admin.query<{ok:boolean}>(
   "SELECT pg_try_advisory_lock(20261111,40) AS ok");
  if(lock.rows[0]?.ok!==true)throw Error("migration-rollback-operator-busy");
  locked=true;
  const dbs=await admin.query<{datname:string}>(
   "SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])",
   [["smn",last.rollbackDb,last.candidateDb]]);
  const names=new Set(dbs.rows.map(x=>x.datname));
  if(!names.has("smn")||!names.has(last.rollbackDb)||names.has(last.candidateDb))
   throw Error("migration-rollback-database-state-invalid");
  const busy=await admin.query<{n:string}>(
   "SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity "+
   "WHERE datname=ANY($1::text[]) AND pid<>pg_backend_pid()",
   [["smn",last.rollbackDb]]);
  if(busy.rows[0]?.n!=="0")throw Error("migration-rollback-database-busy");
  const writeStage=async(stage:"rollback-started"|"rolled-back"|"incident",
   previousMac:string)=>{
   const unsigned={version:1 as const,id:last.id,
    archiveId:last.archiveId,candidateDb:last.candidateDb,
    rollbackDb:last.rollbackDb,stage,at:new Date().toISOString(),previousMac};
   const mac=freshCutoverMac(key,unsigned);
   const h=await open(journalPath,"a",0o600);
   try{await h.writeFile(JSON.stringify({...unsigned,mac})+"\n");await h.sync();}
   finally{await h.close();}
   return mac;
  };
  let mac=await writeStage("rollback-started",last.mac);
  try{
   await admin.query('ALTER DATABASE "smn" RENAME TO "'+last.candidateDb+'"');
   await admin.query('ALTER DATABASE "'+last.rollbackDb+'" RENAME TO "smn"');
   for(const active of groups){
    await rename(active,active+".smn-newpc-prepared-"+last.id);
    await rename(active+".smn-newpc-rollback-"+last.id,active);
   }
   const final=await admin.query<{datname:string}>(
    "SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])",
    [["smn",last.rollbackDb,last.candidateDb]]);
   const actual=new Set(final.rows.map(x=>x.datname));
   if(!actual.has("smn")||!actual.has(last.candidateDb)||
      actual.has(last.rollbackDb))
    throw Error("migration-rollback-verification-failed");
   mac=await writeStage("rolled-back",mac);
   return {mode:"offline-migration-rollback" as const,
    stage:"rolled-back" as const,originalRestored:true as const,
    migratedCandidateRetained:true as const,
    maintenanceMustRemain:true as const,
    allSessionsMustBeReauthenticated:true as const,
    manualReviewRequired:true as const};
  }catch{
   await writeStage("incident",mac).catch(()=>undefined);
   throw Error("migration-rollback-manual-recovery-required");
  }
 }finally{
  key.fill(0);
  if(admin&&locked)await admin.query(
   "SELECT pg_advisory_unlock(20261111,40)").catch(()=>undefined);
  if(admin)await admin.end().catch(()=>undefined);
  // No unlink, DROP DATABASE, or automatic maintenance release.
 }
}
