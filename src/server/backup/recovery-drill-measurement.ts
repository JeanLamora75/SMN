/**
 * Metrics computed from witnessed, isolated recovery drills.
 * These measurements only cover the inspected cutover interval. They are NOT
 * production RPO/RTO evidence, and never validate business targets.
 * Full service restoration requires a separate end-to-end timed rehearsal.
 */
export type RecoveryDrillMeasurement=Readonly<{
 mode:"restore"|"reset";status:"verified"|"unverifiable";
 measuredCutoverMinutes:number|null;
 measuredDataLossMinutes:null;
 productionRtoMinutes:null;productionRpoMinutes:null;
 objectivesValidated:false;
 blockers:readonly string[];
}>;
export function qualifyRecoveryDrill(input:Readonly<{
 mode:"restore"|"reset";startedAt:string;verifiedAt:string;
 databaseMatchesExpected:boolean;filesMatchExpected:boolean;
 rollbackDatabaseVerified:boolean;rollbackFilesVerified:boolean;
 journalVerified:boolean;sessionRevocationVerified:boolean;
}>):RecoveryDrillMeasurement{
 const blockers:string[]=[];
 const valid=(v:string)=>typeof v==="string"&&
  Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
 if(!valid(input.startedAt)||!valid(input.verifiedAt)||
  Date.parse(input.verifiedAt)<Date.parse(input.startedAt))
  blockers.push("recovery-timestamps-unverifiable");
 for(const [key,code] of [
  ["databaseMatchesExpected","recovery-database-unverified"],
  ["filesMatchExpected","recovery-files-unverified"],
  ["rollbackDatabaseVerified","recovery-rollback-database-unverified"],
  ["rollbackFilesVerified","recovery-rollback-files-unverified"],
  ["journalVerified","recovery-journal-unverified"],
  ["sessionRevocationVerified","recovery-session-revocation-unverified"]
 ] as const){
  if(input[key]!==true)blockers.push(code);
 }
 const minutes=blockers.length===0?
  (Date.parse(input.verifiedAt)-Date.parse(input.startedAt))/60000:null;
 return {mode:input.mode,status:minutes!==null?"verified":"unverifiable",
  measuredCutoverMinutes:minutes,measuredDataLossMinutes:null,
  productionRtoMinutes:null,productionRpoMinutes:null,
  objectivesValidated:false,blockers};
}
