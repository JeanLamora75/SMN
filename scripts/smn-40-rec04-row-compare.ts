/**
 * Non-destructive row comparison of two independently restored, isolated
 * PostgreSQL 18 databases. Never compares against or modifies active SMN.
 */
import {Client} from "pg";
import {compareFingerprints,fingerprintPublicTables}
 from "../src/server/backup/restore-row-fingerprint";

const PGPORT="57186";
const REC04="smn_restore_test_rec04_sandbox";
const SECOND=/^smn_restore_test_[a-z0-9_]{6,40}$/;
const norm=(s:string)=>s.replaceAll(String.fromCharCode(92),"/")
 .replace(/\/$/,"").toLowerCase();

function isolatedUrl(input:string,dbName:string){
 const u=new URL(input);
 if(!["postgres:","postgresql:"].includes(u.protocol)||
  !["localhost","127.0.0.1","[::1]"].includes(u.hostname)||
  u.port!==PGPORT||decodeURIComponent(u.pathname)!=="/"+dbName||
  !u.username||!u.password||u.search||u.hash)
  throw Error("isolated-target-denied");
 return input;
}
async function fingerprint(url:string,expectedCluster:string){
 const db=new Client({connectionString:url,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-sandbox-rows-readonly"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const check=await db.query<{version:string;directory:string;schema:number}>(`
   SELECT current_setting('server_version') AS version,
    current_setting('data_directory') AS directory,
    (SELECT schema_version FROM public.smn_installation
     WHERE id='singleton' AND state='initialized') AS schema`);
  if(check.rows.length!==1||!check.rows[0].version.startsWith("18.")||
   norm(check.rows[0].directory)!==norm(expectedCluster)||
   check.rows[0].schema!==33)
   throw Error("sandbox-identity-mismatch");
  const digest=await fingerprintPublicTables(db);
  await db.query("ROLLBACK");
  return digest;
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")throw Error("read-only-only");
 const first=process.env.SMN40_REC04_DATABASE_URL;
 const second=process.env.SMN40_SECOND_RESTORE_URL;
 const cluster=process.env.SMN40_REC04_CLUSTER_DIR;
 if(!first||!second||!cluster||!SECOND.test(new URL(second).pathname.slice(1))||
  new URL(second).pathname.slice(1)===REC04)
  throw Error("two-independent-sandboxes-required");
 isolatedUrl(first,REC04);
 isolatedUrl(second,new URL(second).pathname.slice(1));
 const a=await fingerprint(first,cluster);
 const b=await fingerprint(second,cluster);
 const result=compareFingerprints(a,b);
 process.stdout.write(JSON.stringify({
  mode:"read-only",snapshotCount:2,clusterPort:PGPORT,
  tableCountA:result.tableCountA,tableCountB:result.tableCountB,
  matchingRowsAndTables:result.equivalent,
  differingTableNames:result.differences,
  // Even matching databases could share the same incomplete import.
  sourceArchiveRowEquivalenceProven:false,
  offlineWindowsRollbackQualified:false,
  historicalPrivacyQualified:false,
  deploymentAuthorized:false
 },null,2)+"\n");
 if(!result.equivalent)process.exitCode=2;
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/")
 .endsWith("/smn-40-rec04-row-compare.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 sandbox row comparison unavailable or unsafe; no writes performed.\n");
  process.exitCode=2;
 });
