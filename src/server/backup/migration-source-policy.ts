import type {BackupInventoryEntry} from "./verification";

/**
 * Qualification du paquet sortant seulement. Une archive vérifiée et un registre
 * authentifié peuvent être transportés, mais ne prouvent ni l'exhaustivité de
 * l'historique ni le droit d'activer les données sur un autre ordinateur.
 */
export type MigrationSourceLedger=Readonly<{
 verified:boolean;coverageStart:string|null;pendingErasure:boolean;
 postArchiveErasureCount:number|null;
}>;
export type MigrationSourceReport=Readonly<{
 mode:"computer-migration-source";archiveId:string;
 exportCandidate:boolean;restorationAuthorized:false;
 preservesMemberNames:true;preservesHistory:true;
 blockers:readonly string[];warnings:readonly string[];
 ledgerCoverageStart:string|null;
}>;
const UTC=(s:string|null)=>s!==null&&Number.isFinite(Date.parse(s))&&
 new Date(s).toISOString()===s;
export function assessMigrationSource(
 archive:BackupInventoryEntry,ledger:MigrationSourceLedger
):MigrationSourceReport{
 const blockers:string[]=[];const warnings:string[]=[];
 if(archive.status!=="verified"||archive.integrityVerified!==true||
  archive.scopeComplete!==true||!archive.installationSource||
  archive.schemaVersion!==33||!archive.postgresVersion?.startsWith("18."))
  blockers.push("archive-unverified");
 if(!UTC(archive.createdAt))blockers.push("archive-date-unverified");
 if(!ledger.verified||!UTC(ledger.coverageStart))
  blockers.push("ledger-unverified");
 else if(UTC(archive.createdAt)&&(ledger.coverageStart as string)>(archive.createdAt as string))
  blockers.push("archive-before-ledger-coverage");
 if(ledger.pendingErasure)blockers.push("erasure-pending");
 if(!Number.isSafeInteger(ledger.postArchiveErasureCount)||
  ledger.postArchiveErasureCount===null||ledger.postArchiveErasureCount<0)
  blockers.push("post-archive-erasures-unverified");
 else if(ledger.postArchiveErasureCount>0)
  blockers.push("backup-predates-erasure");
 warnings.push("historical-erasures-not-attested");
 return {mode:"computer-migration-source",archiveId:archive.id,
  exportCandidate:blockers.length===0,restorationAuthorized:false,
  preservesMemberNames:true,preservesHistory:true,
  blockers,warnings,ledgerCoverageStart:ledger.verified?ledger.coverageStart:null};
}
