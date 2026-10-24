/** Import preparation only: no stored value may be overwritten implicitly. */
export type HistoricalCsvDecision="keep"|"insert"|"replace";
export function defaultCsvDecision(existingValue:number|null):HistoricalCsvDecision{
 return existingValue===null?"insert":"keep";
}
export function resolveCsvDecision(existingValue:number|null,proposedValue:number,explicitReplace=false):{
 decision:HistoricalCsvDecision;resultingValue:number|null
}{
 if(existingValue===null)return {decision:"insert",resultingValue:proposedValue};
 if(explicitReplace)return {decision:"replace",resultingValue:proposedValue};
 return {decision:"keep",resultingValue:existingValue};
}
/** Only source metrics explicitly admitted by the CSV catalog can reach an import decision. */
export function isProtectedCsvTarget(code:string):boolean{
 return /(?:CAPACITY|_JH|VELOCITY|SP_FINAL|RATE|EFFICIENCY)/i.test(code);
}
