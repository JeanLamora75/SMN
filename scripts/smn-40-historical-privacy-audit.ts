/**
 * Historical privacy evidence inventory: strictly read-only, fail-closed.
 * No identities, file names, file hashes or credentials are emitted.
 * This cannot establish whether unjournaled removals happened in the past.
 */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {inspectPrivacySchema} from "./smn-40-maintenance";
import {collectArchiveReviewInventory} from "../src/server/backup/erasure-archive-review";
import {inspectExtraArchives} from "../src/server/backup/extra-archives";
import {COLLECTIVE_FAMILIES} from "../src/server/backup/collective-retention-policy";
import {erasureLedgerConfig,readErasureLedger}
 from "../src/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";

const kinds=["pdf","office-report","office-template","private-file"] as const;
type ArchiveCounts=Record<(typeof kinds)[number],number>;
export function historicalPrivacyDecision(input:{
 guardsInstalled:number;archiveCandidates:number;archivesVerified:boolean;
 ledgerState:"unconfigured"|"unverifiable"|"verified";
 historicDeletionEvidence:boolean;collectivesReviewed:number;
}){
 const pending=[
  ...(input.guardsInstalled===7?[]:["sql-guards-not-installed"]),
  ...(input.ledgerState==="verified"?[]:["external-ledger-unqualified"]),
  ...(input.archivesVerified?[]:["archive-inventory-unverified"]),
  "human-archive-review-required",
  ...(input.historicDeletionEvidence?[]:["historical-deletion-attestation-missing"]),
  ...(input.collectivesReviewed===COLLECTIVE_FAMILIES.length?
   []:["collective-retention-review-missing"])
 ];
 return {status:"blocked" as const,pending,
  historicalErasureCoverageQualified:false as const,
  historicalRestoreAuthorized:false as const,
  deploymentAuthorized:false as const};
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")
  throw Error("historical-audit-read-only");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const uri=await installedDatabaseUri();
 const u=new URL(uri);
 if(!["postgres:","postgresql:"].includes(u.protocol)||
  !["localhost","127.0.0.1","[::1]","::1"].includes(u.hostname)||
  !/^smn(?:_[a-z0-9_-]+)?$/i.test(decodeURIComponent(u.pathname.slice(1)))||
  u.search||u.hash)
  throw Error("historical-audit-local-native-only");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:20000,application_name:"smn40-historical-readonly"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const schema=await inspectPrivacySchema(db);
  const guards=["receipt","receipt_immutable","archive_restriction",
   "archive_immutable","member_audit","member_audit_immutable",
   "delete_guard"] as const;
  const installed=guards.filter(k=>schema[k]===true).length;
  let archiveState:"verified"|"unverifiable"="unverifiable";
  let counts:ArchiveCounts|null=null;
  let archiveReason:"private-store-unconfigured"|"archive-validation-failed"|
   "combined-inventory-unavailable"|null=null;
  const privateRoot=process.env.SMN_PRIVATE_DOCUMENTS_DIR;
  // Independently inventory Office/PDF even if private documents are unconfigured.
  try{
   const extras=await inspectExtraArchives(db);
   counts={pdf:extras.pdf.length,"office-report":extras.office.length,
    "office-template":extras.templates.length,"private-file":0};
  }catch{archiveReason="archive-validation-failed";}
  if(!privateRoot){
   archiveReason=archiveReason??"private-store-unconfigured";
  }else if(counts){
   try{
    const inventory=await collectArchiveReviewInventory(db,privateRoot);
    counts={pdf:0,"office-report":0,"office-template":0,"private-file":0};
    for(const candidate of inventory.candidates)counts[candidate.kind]++;
    archiveState=inventory.complete?"verified":"unverifiable";
   }catch{archiveReason="combined-inventory-unavailable";}
  }
  let ledgerState:"unconfigured"|"unverifiable"|"verified"="unconfigured";
  let coverageStart:string|null=null,recordedEvents:number|null=null;
  let unresolvedIntent:boolean|null=null;
  try{
   const config=erasureLedgerConfig();
   if(config){
    config.key.fill(0);ledgerState="unverifiable";
    const ledger=await readErasureLedger();
    coverageStart=ledger.coverageStart;
    recordedEvents=ledger.markers.length;
    unresolvedIntent=await hasUnresolvedErasureIntent();
    if(!unresolvedIntent)ledgerState="verified";
   }
  }catch{ledgerState="unverifiable";}
  const decision=historicalPrivacyDecision({
   guardsInstalled:installed,
   archiveCandidates:counts?Object.values(counts).reduce((a,b)=>a+b,0):0,
   archivesVerified:archiveState==="verified",
   ledgerState,historicDeletionEvidence:false,collectivesReviewed:0
  });
  process.stdout.write(JSON.stringify({
   mode:"read-only",checkedAt:new Date().toISOString(),
   schemaVersion:schema.schema_version,installedGuards:installed,
   archiveInventory:{status:archiveState,counts,
    reason:archiveState==="verified"?null:archiveReason,
    privateStoreConfigured:!!privateRoot,humanReviewStatus:"not-attested"},
   erasureEvidence:{ledgerState,coverageStart,recordedEvents,
    unresolvedIntent,preEnrollmentHistoryAttested:false},
   collectiveRetention:{families:COLLECTIVE_FAMILIES,
    independentlyReviewed:0,complete:false},
   decision
  },null,2)+"\n");
  await db.query("ROLLBACK");
  process.exitCode=2;
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/")
 .endsWith("/smn-40-historical-privacy-audit.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 historical privacy audit unavailable; no data changed.\n");
  process.exitCode=2;
 });
