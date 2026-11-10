/**
 * SMN-34 — Outside Next.js, disposable-only coordinated DB/file rehearsal.
 *
 * Environment (never printed):
 *   SMN_TEST_DATABASE_URL = local PG18 maintenance database /postgres
 *   SMN_CUTOVER_TEST_AUDIT_KEY_HEX = 64 hex chars, ephemeral test key
 *
 * Arguments:
 * --sandbox-cutover <original-db> <candidate-db> <rollback-db>
 *                   <original-files> <candidate-files> <rollback-files>
 *                   <recovered-files> <journal-dir>
 *
 * The existing coordinated drill can rename ONLY smn_restore_test_* DBs
 * and smn_restore_test_* directories under the system temp directory.
 * This script cannot activate an SMN production restore.
 */
import {lstat,realpath} from "node:fs/promises";
import {tmpdir} from "node:os";
import {basename,dirname,isAbsolute,relative,resolve,sep} from "node:path";
import {validateCutoverDrill} from "../src/server/backup/restore-cutover-drill";
import {validateFileCutoverDrill} from "../src/server/backup/restore-file-cutover-drill";
import {rehearseCoordinatedOfflineCutover}
 from "../src/server/backup/restore-coordinated-drill";

const SAFE=/^smn_restore_test_[a-z0-9_]{6,40}$/;
const HEX=/^[a-f0-9]{64}$/;

async function run(){
 const argv=process.argv.slice(2);
 const uri=process.env.SMN_TEST_DATABASE_URL;
 const key=process.env.SMN_CUTOVER_TEST_AUDIT_KEY_HEX;
 if(argv.length!==9||argv[0]!=="--sandbox-cutover"||!uri||!key||!HEX.test(key))
  throw Error("sandbox-cutover-arguments-invalid");
 const [original,candidate,rollback,originalRoot,candidateRoot,
  rollbackRoot,recoveredFilesRoot,journalDir]=argv.slice(1);
 const files={originalRoot,candidateRoot,rollbackRoot};
 const database={maintenanceUri:uri,original,candidate,rollback,
  journalDir,auditKeyHex:key};
 if(!validateCutoverDrill(database)||!validateFileCutoverDrill(files)||
  !isAbsolute(recoveredFilesRoot)||resolve(recoveredFilesRoot)!==recoveredFilesRoot||
  !SAFE.test(basename(recoveredFilesRoot))||
  new Set([originalRoot,candidateRoot,rollbackRoot,recoveredFilesRoot]).size!==4||
  dirname(recoveredFilesRoot)!==dirname(originalRoot)||
  journalDir!==dirname(originalRoot))
  throw Error("sandbox-cutover-disposable-only");
 const root=await lstat(journalDir);
 if(!root.isDirectory()||root.isSymbolicLink())
  throw Error("sandbox-cutover-parent-untrusted");
 const [actualTemp,actualDir]=await Promise.all([
  realpath(resolve(tmpdir())),realpath(journalDir)
 ]);
 const diff=relative(actualTemp,actualDir);
 if(!diff||diff===".."||diff.startsWith(".."+sep)||isAbsolute(diff))
  throw Error("sandbox-cutover-outside-temporary-root");
 const outcome=await rehearseCoordinatedOfflineCutover({
  database,files,recoveredFilesRoot
 });
 // Return only non-sensitive status flags, not key, URL, journal path or files.
 process.stdout.write(JSON.stringify({
  mode:"disposable-sandbox-only",state:outcome.state,
  databaseRollbackPreserved:outcome.databaseRollbackPreserved,
  filesRollbackPreserved:outcome.filesRollbackPreserved,
  productionRestoreEnabled:false
 })+"\n");
 if(outcome.state!=="verified")process.exitCode=2;
}
run().catch(()=>{
 process.stderr.write(
  "SMN-34 sandbox cutover denied or recovery required; production remains locked.\n");
 process.exitCode=2;
});
