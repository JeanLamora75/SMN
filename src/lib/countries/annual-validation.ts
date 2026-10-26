export const ANNUAL_ISSUE_CODES=[
 "country-archived","empty-year","invalid-coverage","invalid-date","invalid-name",
 "duplicate-date","count-mismatch","coverage-missing","source-missing","coverage-note",
 "national-completeness-unverified","national-only"
] as const;
export type AnnualIssueCode=typeof ANNUAL_ISSUE_CODES[number];
export type ValidationIssue={code:AnnualIssueCode;severity:"blocking"|"warning";details?:string};
export type ValidationDiagnostic={
 country:string;year:number;revision:number;fingerprint:string;count:number;
 status:"configured"|"partial"|"not-configured"|"invalid"|null;source:string|null;
 blocking:ValidationIssue[];warnings:ValidationIssue[];
 administrativeValidated:boolean;archived:boolean
};
const isRecord=(x:unknown):x is Record<string,unknown>=>
 !!x&&typeof x==="object"&&!Array.isArray(x);
const statuses=[null,"configured","partial","not-configured","invalid"];
function parseIssue(value:unknown,severity:"blocking"|"warning"):ValidationIssue|null{
 if(!isRecord(value)||!ANNUAL_ISSUE_CODES.includes(value.code as AnnualIssueCode)||
  value.severity!==severity)return null;
 if(value.details!==undefined&&(typeof value.details!=="string"||
  value.details.length>500||/[\u0000-\u001f\u007f]/u.test(value.details)))return null;
 return {code:value.code as AnnualIssueCode,severity,
  ...(typeof value.details==="string"?{details:value.details}:{})};
}
/** Strictly scope the diagnostic to the country and selected year of the dialog. */
export function parseValidationDiagnostic(input:unknown,code:string,year:number):
 ValidationDiagnostic|null{
 if(!isRecord(input)||input.country!==code||input.year!==year||
  !Number.isSafeInteger(input.revision)||Number(input.revision)<0||
  !Number.isSafeInteger(input.count)||Number(input.count)<0||
  typeof input.fingerprint!=="string"||!/^[a-f0-9]{64}$/.test(input.fingerprint)||
  !statuses.includes(input.status as string|null)||
  (input.source!==null&&(typeof input.source!=="string"||input.source.length>256))||
  typeof input.administrativeValidated!=="boolean"||
  typeof input.archived!=="boolean"||
  !Array.isArray(input.blocking)||!Array.isArray(input.warnings)||
  input.blocking.length>100||input.warnings.length>100)return null;
 const blocking=input.blocking.map(x=>parseIssue(x,"blocking"));
 const warnings=input.warnings.map(x=>parseIssue(x,"warning"));
 if(blocking.some(x=>x===null)||warnings.some(x=>x===null))return null;
 return {country:code,year,revision:input.revision as number,
  fingerprint:input.fingerprint,count:input.count as number,
  status:input.status as ValidationDiagnostic["status"],source:input.source as string|null,
  blocking:blocking as ValidationIssue[],warnings:warnings as ValidationIssue[],
  administrativeValidated:input.administrativeValidated as boolean,
  archived:input.archived as boolean};
}
export function canConfirmAnnualDiagnostic(d:ValidationDiagnostic|null,checked:boolean,
 stale=false,busy=false):boolean{
 return !!d&&checked&&!stale&&!busy&&!d.administrativeValidated&&!d.archived&&
  d.count>0&&d.blocking.length===0;
}
export function diagnosticDate(issue:ValidationIssue):string|null{
 if(!issue.details||!/^(19|20|21|22)\d{2}-\d{2}-\d{2}$/.test(issue.details))
  return null;
 return issue.details;
}
