/**
 * OFFLINE ONLY — new, uninitialized SMN installation.
 * This entrypoint deliberately does not create a managed cluster, accept
 * browser requests, disable the external maintenance fence, or delete rollback
 * data. The operator must independently validate the source retirement and
 * prepared managed PostgreSQL 18 candidate before selecting this action.
 */
import {activateFreshManagedInstallation} from "../src/server/backup/fresh-install-cutover";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const CANDIDATE=/^smn_restore_test_newpc_[a-f0-9]{8,16}$/;
async function main(){
 if(process.platform!=="win32")throw Error("migration-windows-required");
 if(!process.env.SMN_BACKUP_DIR){
  try{process.loadEnvFile(".env.local");}catch{/* Default Windows storage. */}
 }
 const args=process.argv.slice(2);
 if(args.length!==10||args[0]!=="--activate-fresh-installation"||
  args[1]!=="--archive"||!UUID.test(args[2])||
  args[3]!=="--candidate"||!CANDIDATE.test(args[4])||
  args[5]!=="--staged-files"||args[7]!=="--receipt"||
  args[9]!=="--confirm=PRISTINE_INSTALLATION_OFFLINE_ONLY")
  throw Error("migration-activation-arguments-invalid");
 const {join}=await import("node:path");
 const result=await activateFreshManagedInstallation({
  archiveId:args[2],candidateDb:args[4],
  stagedRoot:args[6],receiptPath:args[8],
  operatorJournalDir:join(process.cwd(),"data","migration-audit")
 });
 process.stdout.write(JSON.stringify(result)+"\n");
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\\/smn-40-fresh-install-activate\\.(?:ts|mjs)$/))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"fresh-install-offline-activation-unverified",
   maintenanceMustRemain:true,manualReviewRequired:true})+"\n");
  process.exitCode=2;
 });
