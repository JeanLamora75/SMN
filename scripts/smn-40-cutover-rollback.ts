/** Offline-only explicit rollback after a verified new-PC cutover.
 * The original destination is restored; migrated data is parked, not deleted.
 * Maintenance stays in place and all sessions must be recreated.
 */
import {rollbackVerifiedNewComputerCutover}
 from "../src/server/backup/fresh-cutover-rollback";

async function main(){
 if(process.platform!=="win32")throw Error("migration-rollback-windows-required");
 const args=process.argv.slice(2);
 if(args.length!==5||args[0]!=="--journal"||args[2]!=="--receipt"||
  args[4]!=="--confirm=ROLLBACK_VERIFIED_NEWPC_CUTOVER")
  throw Error("migration-rollback-arguments-invalid");
 const result=await rollbackVerifiedNewComputerCutover(args[1],args[3]);
 process.stdout.write(JSON.stringify(result)+"\n");
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\/smn-40-cutover-rollback\.(?:ts|mjs)$/))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"migration-rollback-not-verified",
   maintenanceMustRemain:true,manualReviewRequired:true})+"\n");
  process.exitCode=2;
 });
