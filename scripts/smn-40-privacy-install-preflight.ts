/**
 * Non-mutating preflight for installing additive privacy protections.
 * An intact archive is a prerequisite, not authorization for active restore.
 */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {inspectPrivacySchema} from "./smn-40-maintenance";
import {readErasureLedger,erasureLedgerConfig} from "../src/server/backup/erasure-ledger";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const protectionKeys=["receipt","receipt_immutable","archive_restriction",
 "archive_immutable","member_audit","member_audit_immutable","delete_guard"] as const;

export function privacyInstallDecision(input:{
 v33:boolean;verifiedArchive:boolean;localDatabase:boolean;
 otherDatabaseSessions:number|null;httpStopped:boolean;installedGuards:number;
}){
 const blockers=[
  ...(!input.v33?["schema-not-v33"]:[]),
  ...(!input.localDatabase?["unsafe-database-target"]:[]),
  ...(!input.verifiedArchive?["independent-backup-unverified"]:[]),
  ...(input.otherDatabaseSessions===0?[]:["database-sessions-not-quiescent"]),
  ...(!input.httpStopped?["http-server-not-stopped"]:[])
 ];
 return {readyForExplicitGuardsInstallation:blockers.length===0,
  blockers,alreadyInstalledGuards:input.installedGuards,
  historicalPrivacyQualified:false as const,
  restorationAuthorized:false as const};
}
export function isSafeNativeDatabase(url:string){
 try{
  const uri=new URL(url);
  return ["postgres:","postgresql:"].includes(uri.protocol)&&
   ["localhost","127.0.0.1","[::1]","::1"].includes(uri.hostname)&&
   /^smn(?:_[a-z0-9_-]+)?$/i.test(decodeURIComponent(uri.pathname.slice(1)))&&
   !!uri.username&&!!uri.password&&!uri.search&&!uri.hash;
 }catch{return false;}
}
async function httpStopped(){
 try{
  // Any open listener is conservatively considered active, even if not SMN.
  const response=await fetch("http://127.0.0.1:3003",{
   signal:AbortSignal.timeout(1300)});
  await response.body?.cancel();
  return false;
 }catch(error){
  // Timeout or HTTP error can also mean a live listener. Never equate it
  // with a proven stoppage; this is only a provisional diagnostic.
  const reason=error instanceof Error?error.message:"";
  return /ECONNREFUSED/.test(reason)||/ECONNREFUSED/.test(String((error as {cause?:unknown})?.cause));
 }
}
export async function inspectPrivacyInstallPreflight(archiveId:string){
 if(!UUID.test(archiveId))throw Error("privacy-install-archive-invalid");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const uri=await installedDatabaseUri();
 if(!isSafeNativeDatabase(uri))throw Error("privacy-install-target-invalid");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:15000,application_name:"smn40-privacy-install-readonly"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const state=await inspectPrivacySchema(db);
  const guards=protectionKeys.filter(k=>state[k]===true).length;
  const sessions=await db.query<{count:string}>(`
   SELECT count(*)::text AS count FROM pg_catalog.pg_stat_activity
   WHERE datname=current_database() AND pid<>pg_backend_pid()`);
  const busy=Number(sessions.rows[0]?.count);
  const observed=Number.isSafeInteger(busy)&&busy>=0?busy:null;
  await db.query("ROLLBACK");
  let verifiedArchive=false;
  try{
   const preview=await previewBackupReadOnly(archiveId);
   verifiedArchive=preview.archive.status==="verified"&&
    preview.archive.integrityVerified===true&&
    preview.archive.schemaVersion===33;
  }catch{/* Integrity must not be guessed. */}
  const decision=privacyInstallDecision({
   v33:state.schema_version===33,verifiedArchive,
   localDatabase:true,otherDatabaseSessions:observed,
   httpStopped:await httpStopped(),installedGuards:guards
  });
  return {mode:"read-only" as const,archiveId,guardsInstalled:guards,
   schemaVersion:state.schema_version,verifiedArchive,
   concurrentDatabaseSessions:observed,decision};
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==3||args[0]!=="--archive"||!UUID.test(args[1])||
  args[2]!=="--check")throw Error("privacy-install-readonly-arguments");
 const report=await inspectPrivacyInstallPreflight(args[1]);
 process.stdout.write(JSON.stringify(report,null,2)+"\n");
 if(!report.decision.readyForExplicitGuardsInstallation)process.exitCode=2;
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-privacy-install-preflight.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 privacy preflight unavailable; no change performed.\n");
  process.exitCode=2;
 });
