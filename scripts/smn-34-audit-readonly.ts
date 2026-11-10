/**
 * SMN-34 — Diagnostic local, strictly READ ONLY.
 *
 * From the SMN root on a dedicated Windows validation installation:
 *   pnpm exec tsx scripts/smn-34-audit-readonly.ts --archive <UUID> --audit-only
 *
 * This never performs pg_restore, stops services, writes evidence or enables
 * restore. Output intentionally omits paths, personal identifiers and contents.
 */
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {withSessionReadDb} from "../src/server/auth/database";
import {currentErasureEvidence} from "../src/server/backup/erasure-protection";
import {verifyErasureIntegrity} from "../src/server/backup/erasure-completeness";
import {collectArchiveReviewInventory} from "../src/server/backup/erasure-archive-review";
import {assessRestoreAudit} from "../src/server/backup/restore-audit";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function run(){
 const argv=process.argv.slice(2);
 if(argv.length!==3||argv[0]!=="--archive"||!UUID.test(argv[1])||
  argv[2]!=="--audit-only")throw Error("audit-arguments-invalid");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* Optional settings file. */}
 }
 const preview=await previewBackupReadOnly(argv[1]);
 const state=await withSessionReadDb(async db=>{
  const integrity=await verifyErasureIntegrity(db);
  const privacy=await currentErasureEvidence(preview.archive.createdAt??undefined,db);
  let inventory:Awaited<ReturnType<typeof collectArchiveReviewInventory>>|null=null;
  try{inventory=await collectArchiveReviewInventory(
   db,process.env.SMN_PRIVATE_DOCUMENTS_DIR);
  }catch{/* Unknown inventory means unverified, never empty. */}
  // A snapshot of OTHER PostgreSQL connections to this database.
  // It cannot prove that HTTP or background writers have stopped.
  let connections:number|null=null;
  try{
   const observed=await db.query<{n:string}>(
    "SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity "+
    "WHERE datname=current_database() AND pid<>pg_backend_pid()");
   const value=Number(observed.rows[0]?.n);
   if(Number.isSafeInteger(value)&&value>=0)connections=value;
  }catch{/* Missing permissions or interrupted query means unknown. */}
  return {integrity,privacy,inventory,connections};
 });
 const counts=state.inventory?.candidates.reduce((acc,item)=>{
  if(item.kind==="pdf")acc.pdf++;
  else if(item.kind==="office-report")acc.officeReports++;
  else if(item.kind==="office-template")acc.officeTemplates++;
  else acc.privateFiles++;
  return acc;
 },{pdf:0,officeReports:0,officeTemplates:0,privateFiles:0});
 const result=assessRestoreAudit({
  preview,privacy:state.privacy,erasureIntegrity:state.integrity,
  archiveInventory:counts&&state.inventory?{complete:state.inventory.complete,counts}:null,
  concurrentDatabaseConnections:state.connections,
  platform:process.platform
 });
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 // A diagnostic is NOT an authorization; all incomplete preconditions return 2.
 process.exitCode=2;
}
run().catch(()=>{
 // Never disclose connection strings, member names, filesystem paths, keys.
 process.stderr.write("SMN-34 audit unavailable or input invalid; no restore performed.\n");
 process.exitCode=2;
});
