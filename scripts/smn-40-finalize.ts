/**
 * One-shot operator workflow for native Windows v33: preflight, additive SQL
 * guards, fresh external ledger enrollment, and read-only verification.
 *
 * The independent restore/rollback is an operator attestation, NOT inferred
 * from backup integrity. Never changes a production DB without opt-in.
 */
import {spawnSync} from "node:child_process";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {inspectPrivacyInstallPreflight} from "./smn-40-privacy-install-preflight";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {inspectPrivacySchema} from "./smn-40-maintenance";
import {readErasureLedger} from "../src/server/backup/erasure-ledger";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ATTEST="--isolated-restore-and-rollback-verified=YES";
const APPROVE="--confirm=INSTALL_GUARDS_AND_ENROLL_NEW_LEDGER";
export type FinalizeArgs={mode:"check"|"apply";archiveId:string};
export function parseFinalizeArgs(args:readonly string[]):FinalizeArgs{
 if(args.length===3&&args[0]==="--check"&&args[1]==="--archive"&&UUID.test(args[2]))
  return {mode:"check",archiveId:args[2]};
 if(args.length===5&&args[0]==="--apply"&&args[1]==="--archive"&&UUID.test(args[2])&&
  args[3]===ATTEST&&args[4]===APPROVE)
  return {mode:"apply",archiveId:args[2]};
 throw Error("finalize-arguments-invalid");
}
export function finalizeEligibility(guards:number,ready:boolean){
 return {
  canInstallAndEnroll:guards===0&&ready,
  alreadyInstalled:guards===7,
  restoreAuthorized:false as const,
  historicalHistoryAttested:false as const
 };
}
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
function runStep(script:string,args:string[],extraEnv:Record<string,string>={}){
 const target=resolve(root,"scripts",script);
 // Import TypeScript using the project's installed tsx runtime. Never shell,
 // eval, or pass credentials as command-line arguments.
 const result=spawnSync(process.execPath,["--import","tsx",target,...args],{
  cwd:root,env:{...process.env,...extraEnv},
  encoding:"utf8",windowsHide:true,timeout:120000,maxBuffer:1024*64
 });
 if(result.error||result.status!==0)
  throw Error("finalize-stage-failed:"+script);
 return result.stdout.trim();
}
async function guardCount(){
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const uri=await installedDatabaseUri();
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:10000,application_name:"smn40-finalize-readonly"});
 try{
  await db.connect();
  await db.query("BEGIN READ ONLY");
  const state=await inspectPrivacySchema(db);
  return ["receipt","receipt_immutable","archive_restriction",
   "archive_immutable","member_audit","member_audit_immutable",
   "delete_guard"].filter(k=>state[k as keyof typeof state]===true).length;
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
async function main(){
 if(process.platform!=="win32")throw Error("finalize-windows-only");
 const args=parseFinalizeArgs(process.argv.slice(2));
 const before=await inspectPrivacyInstallPreflight(args.archiveId);
 const eligibility=finalizeEligibility(before.guardsInstalled,
  before.decision.readyForExplicitGuardsInstallation);
 if(args.mode==="check"){
  process.stdout.write(JSON.stringify({mode:"check",
   backupVerified:before.verifiedArchive,
   preflight:before.decision,eligibility},null,2)+"\n");
  if(!eligibility.canInstallAndEnroll)process.exitCode=2;
  return;
 }
 if(!eligibility.canInstallAndEnroll)throw Error("finalize-preflight-refused");
 if(["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX"].some(k=>!!process.env[k]))
  throw Error("finalize-existing-ledger-configuration");
 // Check the external folders before changing SQL: an already-enrolled or
 // partially-created ledger must NEVER be reset.
 const ledgerCheck=runStep("smn-40-ledger-enrollment.ts",["--check"]);
 const inspected=JSON.parse(ledgerCheck) as {canEnrollNewHistory:boolean};
 if(!inspected.canEnrollNewHistory) {
  // At 0/7 the ledger's check intentionally reports false. Only reject
  // existing evidence material, independently of guard readiness.
  const status=inspected as {alreadyEnrolled?:boolean;ledgerIntegrity?:string};
  if(status.alreadyEnrolled||status.ledgerIntegrity!=="not-enrolled")
   throw Error("finalize-ledger-already-exists");
 }
 process.stdout.write("SMN-40 1/3 : précontrôle et sauvegarde vérifiés.\n");
 runStep("smn-40-maintenance.ts",[
  "--apply","--confirm=INSTALL_SENSITIVE_PRIVACY_GUARDS",
  "--backup-verified=YES"
 ],{SMN40_PRIVACY_BACKUP_ARCHIVE_ID:args.archiveId});
 const count=await guardCount();
 if(count!==7)throw Error("finalize-sql-postcheck-failed");
 process.stdout.write("SMN-40 2/3 : sept protections SQL installées et vérifiées.\n");
 // The database migration is committed; a failure here leaves 7/7 and
 // blocks all automatic retries. Never claim that the SQL was rolled back.
 runStep("smn-40-ledger-enrollment.ts",[
  "--enroll","--archive",args.archiveId,
  "--confirm=ENROLL_NEW_HISTORY_FROM_TODAY"
 ]);
 const ledger=await readErasureLedger();
 const verified=await guardCount();
 if(verified!==7)throw Error("finalize-sql-guards-lost");
 process.stdout.write(JSON.stringify({mode:"completed",guardsInstalled:7,
  ledger:"verified",coverageStart:ledger.coverageStart,
  historicalHistoryAttested:false,restorationAuthorized:false},null,2)+"\n");
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-finalize.ts"))
 main().catch((error:unknown)=>{
  const kind=error instanceof Error?error.message:"finalize-error";
  const safe=/^(finalize-[a-z-]+|finalize-stage-failed:[a-z0-9.-]+)$/.test(kind)?
   kind:"finalize-unavailable";
  process.stderr.write("SMN-40 : "+safe+"; aucun contournement autorisé.\n");
  process.exitCode=2;
 });
