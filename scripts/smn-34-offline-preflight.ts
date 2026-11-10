/**
 * SMN-34 — Independent Node/pnpm operator preflight for DISPOSABLE test
 * databases and files only. This does not apply any change, create a
 * maintenance marker, stop SMN, or enable an active restore.
 *
 * Environment: SMN_TEST_DATABASE_URL to the local PG18 "postgres" database.
 * Arguments:
 * --check-test-only <original-db> <candidate-db> <rollback-db>
 *                   <original-files> <candidate-files> <rollback-files>
 */
import {inspectDisposableOfflineScope} from "../src/server/backup/restore-offline-operator-preflight";

async function main(){
 const args=process.argv.slice(2);
 if(args.length!==7||args[0]!=="--check-test-only"||
  !process.env.SMN_TEST_DATABASE_URL)
  throw Error("disposable-preflight-arguments-invalid");
 const report=await inspectDisposableOfflineScope({
  maintenanceUri:process.env.SMN_TEST_DATABASE_URL,
  original:args[1],candidate:args[2],rollback:args[3],
  files:{originalRoot:args[4],candidateRoot:args[5],rollbackRoot:args[6]}
 });
 process.stdout.write(JSON.stringify(report,null,2)+"\n");
 // This never creates an execution permit; even a valid preflight exits 2.
 process.exitCode=2;
}
main().catch(()=>{
 process.stderr.write("SMN-34 disposable preflight unavailable; no restore performed.\n");
 process.exitCode=2;
});
