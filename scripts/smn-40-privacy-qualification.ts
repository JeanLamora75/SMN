/**
 * SMN-40 — qualification strictement non destructive de l'archive v4.
 * Un résultat technique positif n'atteste jamais le contenu Office, les
 * agrégats collectifs ni l'absence d'effacements non journalisés.
 * Aucune donnée personnelle, chemin, nom de fichier ni clé ne sort.
 */
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {readErasureLedger} from "../src/server/backup/erasure-ledger";
import {COLLECTIVE_FAMILIES} from "../src/server/backup/collective-retention-policy";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parsePrivacyQualificationArgs(args:readonly string[]){
 if(args.length===3&&args[0]==="--archive"&&UUID.test(args[1])&&args[2]==="--check")
  return args[1];
 throw Error("privacy-qualification-check-only");
}
export function assessArchiveLedgerTimeline(input:{
 archiveCreatedAt:string|null;ledgerCoverageStart:string|null;
 ledgerMarkers:number|null;
}){
 const start=Date.parse(input.archiveCreatedAt??"");
 const coverage=Date.parse(input.ledgerCoverageStart??"");
 const valid=Number.isFinite(start)&&Number.isFinite(coverage);
 const position=valid?
  start>=coverage?"archive-within-ledger-coverage" as const:
  "archive-before-ledger-coverage" as const:"unverifiable" as const;
 return {position,
  observedMarkers:input.ledgerMarkers,
  postArchiveErasureAbsenceProven:false as const,
  unrecordedHistoryAbsenceProven:false as const,
  explanation:position==="archive-within-ledger-coverage"?
   "Archive créée après le début du registre ; vérifier intégrité, événements postérieurs et sources non journalisées.":
   "Couverture temporelle de l'archive non établie ; attestation indépendante nécessaire."
 };
}
export function buildPrivacyQualification(input:{
 archiveId:string;archiveCreatedAt:string|null;verified:boolean;
 components:readonly {kind:string}[];ledgerCoverageStart:string|null;
 recordedEvents:number|null;
}){
 const count=(kind:string)=>input.components.filter(x=>x.kind===kind).length;
 const officeReports=count("office-report");
 const officeTemplates=count("office-template");
 const pdf=count("report-pdf");
 const timeline=assessArchiveLedgerTimeline({
  archiveCreatedAt:input.archiveCreatedAt,
  ledgerCoverageStart:input.ledgerCoverageStart,
  ledgerMarkers:input.recordedEvents
 });
 return {
  mode:"read-only" as const,archiveId:input.archiveId,
  archiveIntegrityVerified:input.verified,
  office:{reports:officeReports,templates:officeTemplates,pdfs:pdf,
   humanReviewRequired:officeReports+officeTemplates+pdf>0,
   humanContentReviewAttested:false as const,
   personalDataAbsenceProven:false as const,
   checks:["texts-and-table-cells","comments-and-notes","document-properties",
    "hidden-slides-and-shapes","embedded-objects-and-images",
    "identifiers-and-cross-document-reidentification"]},
  collective:{families:COLLECTIVE_FAMILIES.map(family=>({
   family,review:"pending-independent-assessment" as const,
   action:"undecided" as const})),
   allSevenQualified:false as const,
   protectedAggregatesMayBeReidentifying:true as const},
  erasure:{timeline,externalSourcesReconciled:false as const,
   unmatchedErasureEvidenceExcluded:false as const},
  isolatedRestorationsPreserved:true as const,
  restorationAuthorized:false as const
 };
}
async function main(){
 const archiveId=parsePrivacyQualificationArgs(process.argv.slice(2));
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const preview=await previewBackupReadOnly(archiveId);
 const verified=preview.archive.status==="verified"&&
  preview.archive.integrityVerified&&preview.archive.scopeComplete===true;
 if(!verified)throw Error("archive-not-integrity-verified");
 const ledger=await readErasureLedger();
 const out=buildPrivacyQualification({
  archiveId,archiveCreatedAt:preview.archive.createdAt,
  verified,components:preview.archive.components,
  ledgerCoverageStart:ledger.coverageStart,recordedEvents:ledger.markers.length
 });
 process.stdout.write(JSON.stringify(out,null,2)+"\n");
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-privacy-qualification.ts"))
 main().catch((err:unknown)=>{
  const permitted=new Set(["privacy-qualification-check-only",
   "archive-not-integrity-verified"]);
  const reason=err instanceof Error&&permitted.has(err.message)?err.message:"unverified";
  process.stderr.write(JSON.stringify({mode:"read-only",status:"blocked",
   reason,activeInstallationModified:false,restorationAuthorized:false})+"\n");
  process.exitCode=2;
 });
