/**
 * Windows rollback rehearsal: dedicated PG18 cluster and disposable test DBs.
 * Never renames the two latest restored databases, REC-04 or active SMN.
 */
import {spawn} from "node:child_process";
import {Client} from "pg";
import {resolve} from "node:path";

const TESTS=[
 "tests/epic2-lot5-cutover-pg.test.ts",
 "tests/epic2-lot5-file-cutover.test.ts",
 "tests/smn-34-offline-cutover-cli-pg.test.ts"
] as const;
const HOSTS=new Set(["127.0.0.1","localhost","[::1]"]);
type AuditStage="arguments"|"connection"|"physical-cluster"|"restored-databases"|"test-runner";
let auditStage:AuditStage="arguments";
export function validWindowsRollbackScope(url:string,expectedCluster:string){
 try{
  const u=new URL(url);
  return !!expectedCluster&&
   ["postgres:","postgresql:"].includes(u.protocol)&&
   HOSTS.has(u.hostname)&&u.port==="57186"&&
   decodeURIComponent(u.pathname)==="/postgres"&&
   !!u.username&&!!u.password&&!u.search&&!u.hash&&
   resolve(expectedCluster)===expectedCluster;
 }catch{return false;}
}
export async function runWindowsSandboxRollback(
 url:string,expectedCluster:string,
 spawnTests:(url:string)=>Promise<number>=runTests
){
 if(process.platform!=="win32")throw Error("windows-host-required");
 if(!validWindowsRollbackScope(url,expectedCluster))
  throw Error("isolated-postgres-scope-invalid");
 auditStage="connection";
 const db=new Client({connectionString:url,connectionTimeoutMillis:3500,
  statement_timeout:8000,application_name:"smn40-windows-rollback-scope"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION READ ONLY");
  const r=await db.query<{directory:string;version:string}>(`
   SELECT current_setting('data_directory') AS directory,
    current_setting('server_version') AS version`);
  auditStage="physical-cluster";
  const normal=(s:string)=>s.replaceAll(String.fromCharCode(92),"/")
   .replace(/\/$/,"").toLowerCase();
  if(r.rows.length!==1||
   normal(r.rows[0].directory)!==normal(expectedCluster)||
   !r.rows[0].version.startsWith("18."))
   throw Error("isolated-postgres-identity-mismatch");
  auditStage="restored-databases";
  // Both previously restored databases must be present and preserved.
  const names=await db.query<{datname:string}>(`
   SELECT datname FROM pg_catalog.pg_database
   WHERE datname=ANY($1::text[])`,[[
    "smn_restore_test_latest_backup_20261111","smn_restore_test_latest_compare_20261111"
   ]]);
  if(names.rows.length!==2)throw Error("restored-snapshots-missing");
  await db.query("ROLLBACK");
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
 auditStage="test-runner";
 const exit=await spawnTests(url);
 return {mode:"windows-isolated-rollback-rehearsal" as const,
  tests:TESTS,passed:exit===0,
  firstRestorePreserved:true,secondRestorePreserved:true,
  activeInstallationModified:false,windowsProductionRollbackQualified:false,
  privacyHistoryQualified:false,productionRestoreEnabled:false};
}
function runTests(url:string):Promise<number>{
 return new Promise((resolveDone,reject)=>{
  const child=spawn(process.execPath,["--import","tsx","--test",...TESTS],{
   cwd:process.cwd(),windowsHide:true,
   env:{...process.env,SMN_TEST_DATABASE_URL:url},
   stdio:["ignore","inherit","inherit"]
  });
  child.on("error",reject);
  child.on("close",code=>resolveDone(code??2));
 });
}
async function main(){
 const argumentsText=process.argv.slice(2).join(" ");
 const checkOnly=argumentsText==="--check";
 if(!checkOnly&&argumentsText!=="--sandbox-only")
  throw Error("sandbox-only-arguments-required");
 const url=process.env.SMN40_REC04_DATABASE_URL;
 const expected=process.env.SMN40_REC04_CLUSTER_DIR;
 if(!url||!expected)throw Error("isolated-connection-not-set");
 const maintenance=new URL(url);
 maintenance.pathname="/postgres";
 if(!validWindowsRollbackScope(maintenance.toString(),expected))
  throw Error("isolated-scope-invalid");
 if(checkOnly){
  // Exactly the same physical identity and restored database checks,
  // without running subprocesses or creating disposable databases.
  const checked=await runWindowsSandboxRollback(
   maintenance.toString(),expected,async()=>0);
  process.stdout.write(JSON.stringify({
   mode:"read-only",status:"ready",physicalClusterVerified:true,
   restoredDatabasesPresent:checked.firstRestorePreserved&&checked.secondRestorePreserved,
   disposableTestsStarted:false,activeInstallationModified:false,
   productionRestoreEnabled:false
  },null,2)+"\n");
  return;
 }
 const result=await runWindowsSandboxRollback(maintenance.toString(),expected);
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(!result.passed)process.exitCode=2;
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/")
 .endsWith("/smn-40-windows-rollback-sandbox.ts"))
 main().catch((error:unknown)=>{
  const allowed=new Set(["windows-host-required","sandbox-only-arguments-required",
   "isolated-connection-not-set","isolated-scope-invalid",
   "isolated-postgres-scope-invalid","isolated-postgres-identity-mismatch",
   "restored-snapshots-missing"]);
  const pgCode=error&&typeof error==="object"&&"code" in error?
   (error as {code?:unknown}).code:null;
  const classified=pgCode==="28P01"?"invalid-credentials":
   pgCode==="42501"?"isolated-database-permission-denied":
   pgCode==="3D000"?"isolated-database-missing":
   pgCode==="ECONNREFUSED"?"isolated-postgres-unreachable":null;
  const reason=classified??(error instanceof Error&&allowed.has(error.message)?
   error.message:"rollback-rehearsal-unverified");
  process.stderr.write(JSON.stringify({
   mode:"windows-isolated-rollback-rehearsal",passed:false,
   reason,stage:auditStage,productionRestoreEnabled:false
  })+"\n");
  process.exitCode=2;
 });
