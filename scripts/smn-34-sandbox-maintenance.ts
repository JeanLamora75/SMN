/**
 * SMN-34 — Independent maintenance-fence probe for TEMPORARY test instances.
 *
 * --begin <absolute TEMP/<répertoire-test>/maintenance.lock>
 * --inspect <absolute TEMP/<test-directory>/maintenance.lock>
 *
 * This script NEVER stops the server, removes the fence or enables restoration.
 * An operator must independently attest quiescence and close the maintenance
 * window after all recovery checks. The fence is durable across Node processes.
 */
import {lstat,realpath} from "node:fs/promises";
import {tmpdir} from "node:os";
import {basename,dirname,isAbsolute,relative,resolve,sep} from "node:path";
import {beginOfflineRestoreMaintenance,inspectOfflineRestoreMaintenance,
 restoreMaintenanceActive} from "../src/server/backup/restore-maintenance";

async function verifyTestMarker(path:string):Promise<boolean>{
 if(!isAbsolute(path)||resolve(path)!==path||basename(path)!=="maintenance.lock")
  return false;
 const parent=dirname(path);
 if(!/^smn_restore_test_[a-z0-9_]{6,40}$/.test(basename(parent)))
  return false;
 const st=await lstat(parent);
 if(!st.isDirectory()||st.isSymbolicLink())return false;
 const physicalTmp=await realpath(resolve(tmpdir()));
 const physicalParent=await realpath(parent);
 const rel=relative(physicalTmp,physicalParent);
 return rel!==""&&rel!==".."&&!rel.startsWith(".."+sep)&&!isAbsolute(rel);
}
async function run(){
 const args=process.argv.slice(2);
 if(args.length!==2||!["--begin","--inspect"].includes(args[0])||
  !await verifyTestMarker(args[1]))throw Error("maintenance-sandbox-scope-invalid");
 process.env.SMN_RESTORE_MAINTENANCE_MARKER=args[1];
 // This check detects invalid location configuration before any file writes.
 if(args[0]==="--begin"){
  await beginOfflineRestoreMaintenance();
  process.stdout.write(JSON.stringify({mode:"sandbox-maintenance",
   status:"fenced",restoreEnabled:false,serverStoppedProven:false})+"\n");
 }else{
  const record=await inspectOfflineRestoreMaintenance();
  if(!record||!await restoreMaintenanceActive())
   throw Error("maintenance-fence-missing");
  process.stdout.write(JSON.stringify({mode:"sandbox-maintenance",
   status:"fenced",restoreEnabled:false,serverStoppedProven:false,
   purpose:record.purpose})+"\n");
 }
}
run().catch(()=>{
 process.stderr.write("SMN-34 sandbox maintenance denied; production remains locked.\n");
 process.exitCode=2;
});
