import type {BackupInventoryEntry} from "./verification";

/**
 * A clean installation may have no current SMN identity. This is not an
 * identity mismatch, but a distinct import workflow with stricter evidence.
 * The policy never grants permission to switch active databases.
 */
export type MigrationDestination=
 | Readonly<{state:"uninitialized";postgresMajor:number;publicUserTables:number;
   managedFiles:number;existingLedger:boolean}>
 | Readonly<{state:"existing";postgresMajor:number;publicUserTables:number;
   managedFiles:number;existingLedger:boolean;installationSource:string|null}>
 | Readonly<{state:"unverifiable"}>;

export type MigrationAssessment=Readonly<{
 purpose:"computer-migration";eligibleForIsolatedReconstruction:boolean;
 readyForProduction:false;restorationAuthorized:false;
 memberNames:"preserve";memberHistory:"preserve";
 blockers:readonly string[];
}>;

export function assessNewComputerMigration(
 archive:BackupInventoryEntry,destination:MigrationDestination,
 externalLedger:{integrityVerified:boolean;coverageReconciled:boolean}
):MigrationAssessment{
 const blockers:string[]=[];
 if(archive.status!=="verified"||archive.integrityVerified!==true||
  archive.scopeComplete!==true||!archive.installationSource)
  blockers.push("archive-unverified");
 if(destination.state==="unverifiable"){
  blockers.push("destination-unverifiable");
 }else{
  if(destination.state!=="uninitialized")blockers.push("destination-not-pristine");
  if(destination.publicUserTables!==0||destination.managedFiles!==0||
   destination.existingLedger)blockers.push("destination-not-empty");
  if(!archive.postgresVersion||
   Number(archive.postgresVersion.split(".")[0])!==destination.postgresMajor)
   blockers.push("postgres-incompatible");
 }
 if(!externalLedger.integrityVerified||!externalLedger.coverageReconciled)
  blockers.push("erasure-ledger-transfer-unqualified");
 return {purpose:"computer-migration",
  eligibleForIsolatedReconstruction:blockers.length===0,
  readyForProduction:false,restorationAuthorized:false,
  memberNames:"preserve",memberHistory:"preserve",blockers};
}
