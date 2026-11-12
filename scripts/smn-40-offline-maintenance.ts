/** External operator: install or inspect a persistent migration fence.
 * The Windows launcher and authentication will fail closed even after the
 * operator shell exits. No database writes or marker removal here.
 */
import {readFile,lstat} from "node:fs/promises";
import {beginOfflineRestoreMaintenance,inspectOfflineRestoreMaintenance,
 localRestoreMaintenanceLockPath} from "../src/server/backup/restore-maintenance";

async function main(){
 if(process.platform!=="win32"||process.env.SMN_DATABASE_URL)
  throw Error("migration-maintenance-windows-local-only");
 const args=process.argv.slice(2);
 if(args.length===2&&args[0]==="--begin"&&
   args[1]==="--confirm=FENCE_NEWPC_MIGRATION"){
  const marker=await beginOfflineRestoreMaintenance();
  process.stdout.write(JSON.stringify({
   mode:"migration-maintenance",state:"fenced",
   operationId:marker.operationId,
   launcherBlocked:true,serverStoppedProven:false,
   sourceFrozenProven:false,restorationAuthorized:false
  })+"\n");
 }else if(args.length===1&&args[0]==="--inspect"){
  const marker=await inspectOfflineRestoreMaintenance();
  if(!marker||marker.purpose!=="offline-restore")
   throw Error("migration-maintenance-not-found");
  const file=await lstat(localRestoreMaintenanceLockPath());
  if(!file.isFile()||file.isSymbolicLink()||file.size<20||file.size>2048)
   throw Error("migration-maintenance-local-unsafe");
  const local=JSON.parse(await readFile(localRestoreMaintenanceLockPath(),"utf8"));
  if(local.operationId!==marker.operationId||local.purpose!==marker.purpose)
   throw Error("migration-maintenance-identity-mismatch");
  process.stdout.write(JSON.stringify({
   mode:"migration-maintenance",state:"fenced",
   operationId:marker.operationId,launcherBlocked:true,
   serverStoppedProven:false,restorationAuthorized:false
  })+"\n");
 }else throw Error("migration-maintenance-arguments-invalid");
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\/smn-40-offline-maintenance\.(?:ts|mjs)$/))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"migration-maintenance-unverified",restorationAuthorized:false})+"\n");
  process.exitCode=2;
 });
