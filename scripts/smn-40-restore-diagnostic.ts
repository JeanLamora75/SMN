/**
 * SMN-40 — Diagnostic ciblé strictement en lecture seule.
 * Usage: pnpm exec tsx scripts/smn-40-restore-diagnostic.ts --archive <UUID> --check
 * Aucune restauration, suppression, mutation de schéma ou bascule de fichiers.
 * Les noms de personnes, documents et secrets ne sont jamais affichés.
 */
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {withSessionReadDb} from "../src/server/auth/database";
import {currentErasureEvidence} from "../src/server/backup/erasure-protection";
import {assessRestoreGate} from "../src/server/backup/restore-readiness";
import {verifyErasureIntegrity} from "../src/server/backup/erasure-completeness";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseRestoreDiagnosticArgs(args:readonly string[]):string{
 if(args.length===3&&args[0]==="--archive"&&UUID.test(args[1])&&args[2]==="--check")
  return args[1];
 throw Error("diagnostic-arguments-invalid");
}
export function restoreDiagnosticGuidance(input:{
 archiveCreatedAt:string|null;coverageStart:string|null;
 blockers:readonly string[];integrityReason:string;
}):{historicalCoverage:"outside-ledger"|"within-ledger"|"unverifiable";
 nextActions:readonly string[]}{
 const coverage=input.archiveCreatedAt&&input.coverageStart?
  Date.parse(input.archiveCreatedAt)<Date.parse(input.coverageStart)?"outside-ledger":"within-ledger":
  "unverifiable";
 const actions:string[]=[];
 if(coverage==="outside-ledger")actions.push("qualify-pre-enrollment-erasures-independently");
 if(coverage==="unverifiable")actions.push("verify-archive-date-and-ledger-coverage");
 if(input.integrityReason!=="qualified-empty-archives-and-guarded-member-erasure")
  actions.push("qualify-erasure-receipts-and-personal-archive-content");
 if(input.blockers.some(v=>v.includes("incompatible")||v.includes("different-installation")))
  actions.push("qualify-archive-identity-and-v33-compatibility");
 if(input.blockers.some(v=>v.includes("verified")||v.includes("incomplete")))
  actions.push("validate-archive-and-restore-in-isolated-pg18");
 actions.push("qualify-real-offline-windows-cutover-and-rollback");
 return {historicalCoverage:coverage,nextActions:[...new Set(actions)]};
}
async function main(){
 const archiveId=parseRestoreDiagnosticArgs(process.argv.slice(2));
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const preview=await previewBackupReadOnly(archiveId);
 const {evidence,integrity}=await withSessionReadDb(async db=>({
  evidence:await currentErasureEvidence(preview.archive.createdAt??undefined,db),
  integrity:await verifyErasureIntegrity(db)
 }));
 const gate=assessRestoreGate(preview,evidence);
 const coverageStart=evidence.state==="verified"?evidence.coverageStart:null;
 const guidance=restoreDiagnosticGuidance({
  archiveCreatedAt:preview.archive.createdAt,coverageStart,
  blockers:gate.blockers,integrityReason:integrity.reason
 });
 process.stdout.write(JSON.stringify({
  mode:"read-only",archiveId,archiveCreatedAt:preview.archive.createdAt,
  archiveStatus:preview.archive.status,archiveIntegrityVerified:preview.archive.integrityVerified,
  schemaVersion:preview.archive.schemaVersion,
  ledgerState:evidence.state,coverageStart,integrityComplete:integrity.complete,
  integrityReason:integrity.reason,gate:{decision:gate.decision,blockers:gate.blockers,
   canExecute:false},guidance
 },null,2)+"\n");
 // A blocked restoration is an expected diagnostic result, not a script failure.
 // This script NEVER grants authorization, regardless of evidence.
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-restore-diagnostic.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 diagnostic indisponible : aucune restauration effectuée.\n");
  process.exitCode=2;
 });
