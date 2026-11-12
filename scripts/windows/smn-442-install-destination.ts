/** Internal CI-only fixture; never packaged or run on user devices. */
import assert from "node:assert/strict";
import {installExpress} from "../../src/server/installation/install";
async function main(){
 if(process.platform!=="win32"||process.env.GITHUB_ACTIONS!=="true"||
  process.env.SMN_GUI_E2E_FIXTURE!=="YES")
  throw Error("smn-442-fixture-ci-only");
 const raw=process.env.SMN_GUI_E2E_TEST_URI;
 if(!raw)throw Error("smn-442-fixture-uri-required");
 const url=new URL(raw);
 if(url.hostname!=="127.0.0.1"||url.pathname!=="/smn"||
  !url.port||url.username!=="smn_owner"||!url.password)
  throw Error("smn-442-fixture-uri-unsafe");
 const state=await installExpress({
  password:"DestinationInitialCI2026!",adminUsername:"destination-ci",
  adminEmail:"destination-ci@example.test"
 },raw);
 assert.deepEqual(state,{ok:true});
 process.stdout.write("SMN-442: isolated initialized destination ready\n");
}
main().catch(()=>{
 process.stderr.write("SMN-442: isolated installation refused\n");
 process.exitCode=2;
});
