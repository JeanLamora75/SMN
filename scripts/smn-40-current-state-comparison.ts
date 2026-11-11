/**
 * Compare the still-current source installation and an independently
 * reconstructed PostgreSQL 18 candidate WITHOUT copying raw member data.
 * Only read-only queries are issued. This result does not certify that the
 * source is frozen or authorize activation.
 */
import {Client} from "pg";
import {fingerprintPublicTables,compareFingerprints}
 from "../src/server/backup/restore-row-fingerprint";
import {validateSandboxTarget} from "../src/server/backup/restore-sandbox-policy";

export function validComparisonTarget(source:string,candidate:string):boolean{
 try{
  const s=new URL(source),t=new URL(candidate);
  return validateSandboxTarget(source,candidate)&&
   s.hostname==="127.0.0.1"&&t.hostname==="127.0.0.1"&&
   /^smn_restore_test_newpc_[a-f0-9]{8,16}$/.test(
    decodeURIComponent(t.pathname.slice(1)))&&
   s.port!==t.port&&s.username!==t.username&&
   ![57186,57187,57188,57189].includes(Number(t.port));
 }catch{return false;}
}
export async function compareCurrentDatabaseWithCandidate(source:string,candidate:string){
 if(!validComparisonTarget(source,candidate))
  throw Error("migration-comparison-target-invalid");
 const a=new Client({connectionString:source,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-source-fingerprint-readonly"});
 const b=new Client({connectionString:candidate,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-candidate-fingerprint-readonly"});
 let aOpen=false,bOpen=false;
 try{
  await a.connect();aOpen=true;
  await b.connect();bOpen=true;
  for(const db of [a,b]){
   await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
   const version=await db.query<{v:string}>(
    "SELECT current_setting('server_version') AS v");
   if(!version.rows[0]?.v.startsWith("18."))
    throw Error("migration-comparison-pg18-required");
  }
  const sourceFingerprint=await fingerprintPublicTables(a);
  const candidateFingerprint=await fingerprintPublicTables(b);
  const compared=compareFingerprints(sourceFingerprint,candidateFingerprint);
  return {mode:"read-only-state-comparison" as const,
   equivalent:compared.equivalent,
   sourceTables:compared.tableCountA,candidateTables:compared.tableCountB,
   differingTables:compared.differences,
   sourceDigest:sourceFingerprint.digest,
   candidateDigest:candidateFingerprint.digest,
   sourceFreezeAttested:false as const,
   fileEquivalenceAttested:false as const,
   historicalErasureCoverageCertified:false as const,
   restorationAuthorized:false as const,
   activeInstallationModified:false as const};
 }finally{
  if(aOpen)await a.query("ROLLBACK").catch(()=>undefined);
  if(bOpen)await b.query("ROLLBACK").catch(()=>undefined);
  await a.end().catch(()=>undefined);await b.end().catch(()=>undefined);
 }
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==1||args[0]!=="--check")throw Error("comparison-arguments-invalid");
 const source=process.env.SMN40_CURRENT_SOURCE_URL;
 const candidate=process.env.SMN40_NEWPC_SANDBOX_URL;
 if(!source||!candidate)throw Error("comparison-urls-missing");
 const result=await compareCurrentDatabaseWithCandidate(source,candidate);
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(!result.equivalent)process.exitCode=2;
}
if(process.argv[1]?.replaceAll("\\","/")
 .endsWith("/smn-40-current-state-comparison.ts"))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"comparison-unverifiable",restorationAuthorized:false,
   activeInstallationModified:false})+"\n");
  process.exitCode=2;
 });
