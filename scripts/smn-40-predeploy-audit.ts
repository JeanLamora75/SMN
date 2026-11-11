/**
 * Non-destructive readiness inventory for existing native v33 installations.
 * This audit never alters schema, member rows, documents or external ledgers.
 * It is evidence gathering, NOT a deployment approval or backup verification.
 */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {inspectPrivacySchema} from "./smn-40-maintenance";
import {erasureLedgerConfig,readErasureLedger} from "../src/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";

export function predeployDecision(input:{
 schemaVersion:number;
 guardsPresent:number;
 unresolvedIntent:boolean|null;
 historicalCoverageComplete:boolean;
 backupIndependentlyVerified:boolean;
}){
 return {
  deploymentAuthorized:false as const,
  historicalRestoreAuthorized:false as const,
  schemaCompatible:input.schemaVersion===33,
  missingGuards:Math.max(0,7-input.guardsPresent),
  requiresIndependentBackupVerification:!input.backupIndependentlyVerified,
  requiresHistoricalPrivacyReconciliation:!input.historicalCoverageComplete,
  unresolvedIntent:input.unresolvedIntent
 };
}

async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")
  throw Error("predeploy-readonly-check-only");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const uri=await installedDatabaseUri();
 const target=new URL(uri);
 if(!["postgres:","postgresql:"].includes(target.protocol)||
  !["localhost","127.0.0.1","[::1]","::1"].includes(target.hostname)||
  !/^smn(?:_[a-z0-9_-]+)?$/i.test(decodeURIComponent(target.pathname.slice(1))))
  throw Error("predeploy-local-native-database-required");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:15000,application_name:"smn40-readonly-predeploy"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const state=await inspectPrivacySchema(db);
  const guardKeys=[
   "receipt","receipt_immutable","archive_restriction","archive_immutable",
   "member_audit","member_audit_immutable","delete_guard"
  ] as const;
  const guardCount=guardKeys.filter(key=>state[key]===true).length;
  const counts=await db.query<{members:string;pdf_archives:string}>(
   "SELECT (SELECT count(*)::text FROM public.smn_member) AS members,"+
   " (SELECT count(*)::text FROM public.smn_report_pdf_archive) AS pdf_archives");
  let removalAudits="not-installed";
  if(state.member_audit){
   const audit=await db.query<{total:string}>(
    "SELECT count(*)::text AS total FROM public.smn_member_removal_audit");
   removalAudits=audit.rows[0]?.total??"unavailable";
  }
  let ledger:"unconfigured"|"unverifiable"|"verified"="unconfigured";
  let pending:boolean|null=null;
  try{
   const config=erasureLedgerConfig();
   if(config){
    config.key.fill(0);
    ledger="unverifiable";
    await readErasureLedger();
    pending=await hasUnresolvedErasureIntent();
    if(!pending)ledger="verified";
   }
  }catch{ledger="unverifiable";}
  const decision=predeployDecision({schemaVersion:state.schema_version,
   guardsPresent:guardCount,unresolvedIntent:pending,
   historicalCoverageComplete:false,backupIndependentlyVerified:false});
  process.stdout.write(JSON.stringify({mode:"read-only",checkedAt:new Date().toISOString(),
   schemaVersion:state.schema_version,protections:state,
   counts:{...counts.rows[0],removal_audits:removalAudits},externalLedger:ledger,decision},null,2)+"\n");
  await db.query("ROLLBACK");
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/")
 .endsWith("/smn-40-predeploy-audit.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 predeploy audit unavailable (no database details logged).\n");
  process.exitCode=1;
 });
