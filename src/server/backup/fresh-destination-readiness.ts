/** Read-only assessment of a new-PC destination before any offline cutover.
 * An express-installed SMN database is NOT pristine even if it has no team.
 * Never interpret a failed probe as permission to drop or reset a database.
 */
export type FreshDestinationEvidence=Readonly<{
 postgresMajor:number|null;
 managedClusterOwned:boolean;
 activeDatabaseExists:boolean;
 publicUserTableCount:number|null;
 managedFileCount:number|null;
 existingLedger:boolean|null;
 maintenanceMarkerPresent:boolean;
 webServerStopped:boolean;
 sourceReceiptVerified:boolean;
 candidateFingerprintMatched:boolean;
}>;
export type FreshDestinationDecision=Readonly<{
 state:"pristine"|"initialized-or-populated"|"unverifiable";
 mayConsiderOfflineCutover:boolean;
 restorationAuthorized:false;
 blockers:readonly string[];
}>;
export function assessFreshDestination(
 e:FreshDestinationEvidence
):FreshDestinationDecision{
 const blockers:string[]=[];
 if(e.postgresMajor!==18||!e.managedClusterOwned)
  blockers.push("destination-runtime-unverified");
 if(!e.activeDatabaseExists||e.publicUserTableCount===null||
   e.publicUserTableCount<0||!Number.isSafeInteger(e.publicUserTableCount)||
   e.managedFileCount===null||e.managedFileCount<0||
   !Number.isSafeInteger(e.managedFileCount)||e.existingLedger===null)
  blockers.push("destination-inspection-incomplete");
 if(e.publicUserTableCount!==0||e.managedFileCount!==0||
    e.existingLedger!==false)
  blockers.push("destination-not-pristine");
 if(!e.maintenanceMarkerPresent||!e.webServerStopped)
  blockers.push("destination-not-offline");
 if(!e.sourceReceiptVerified||!e.candidateFingerprintMatched)
  blockers.push("source-candidate-proof-missing");
 const state=blockers.includes("destination-inspection-incomplete")?
  "unverifiable":blockers.includes("destination-not-pristine")?
  "initialized-or-populated":"pristine";
 return {state,mayConsiderOfflineCutover:blockers.length===0,
  restorationAuthorized:false,blockers};
}
