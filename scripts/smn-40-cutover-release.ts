/** Offline source-retirement signoff and reauthentication gate release.
 * Never invoked via HTTP. Refuses automatic or partial release.
 */
import {releaseVerifiedNewComputerCutover}
 from "../src/server/backup/fresh-cutover-release";

async function main(){
 if(process.platform!=="win32")throw Error("migration-release-windows-required");
 const args=process.argv.slice(2);
 if(args.length!==5||args[0]!=="--journal"||args[2]!=="--receipt"||
  args[4]!=="--confirm=INDEPENDENT_SOURCE_RETIRED_AND_REAUTH_APPROVED")
  throw Error("migration-release-arguments-invalid");
 const result=await releaseVerifiedNewComputerCutover(args[1],args[3]);
 process.stdout.write(JSON.stringify(result)+"\n");
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\/smn-40-cutover-release\.(?:ts|mjs)$/))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"migration-release-not-verified",
   manualReviewRequired:true})+"\n");
  process.exitCode=2;
 });
