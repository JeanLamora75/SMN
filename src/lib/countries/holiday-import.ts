export type ImportFormat="csv"|"ics";
export type ImportPolicy="skip"|"replace";
export type ImportRow={line:number;date:string;name:string;country:string;
 action:"create"|"replace"|"reject";reason:string|null;previousName:string|null};
export type ImportPreview={rows:ImportRow[];proposed:number;rejected:number;
 fingerprint:string;country:string;policy:ImportPolicy};
export type ImportYearSummary={year:number|null;proposed:number;rejected:number;
 created:number;replaced:number};
export const IMPORT_MAX_BYTES=1024*1024;
export const IMPORT_PAGE_SIZE=50;

export function detectLocalImportFormat(filename:string):ImportFormat|null{
 const extension=filename.trim().toLowerCase().match(/\.([a-z]+)$/u)?.[1];
 return extension==="csv"||extension==="ics"?extension:null;
}
export function isExpectedImportPreview(raw:unknown,country:string,policy:ImportPolicy):raw is ImportPreview{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const v=raw as Record<string,unknown>;
 if(v.country!==country||v.policy!==policy||!Array.isArray(v.rows)||
  !Number.isSafeInteger(v.proposed)||!Number.isSafeInteger(v.rejected)||
  Number(v.proposed)<0||Number(v.rejected)<0||
  typeof v.fingerprint!=="string"||!/^[a-f0-9]{64}$/u.test(v.fingerprint))return false;
 if(v.rows.length!==Number(v.proposed)+Number(v.rejected)||v.rows.length>5000)return false;
 return v.rows.every(row=>{
  if(!row||typeof row!=="object"||Array.isArray(row))return false;
  const r=row as Record<string,unknown>;
  return Number.isSafeInteger(r.line)&&Number(r.line)>0&&
   typeof r.date==="string"&&typeof r.name==="string"&&
   typeof r.country==="string"&&
   (r.action==="create"||r.action==="replace"||r.action==="reject")&&
   (r.reason===null||typeof r.reason==="string")&&
   (r.previousName===null||typeof r.previousName==="string");
 });
}
export function summarizeImportPreview(rows:ImportRow[]):ImportYearSummary[]{
 const buckets=new Map<number|null,ImportYearSummary>();
 for(const r of rows){
  const y=/^(19|20|21|22)\d{2}-\d{2}-\d{2}$/u.test(r.date)?
   Number(r.date.slice(0,4)):null;
  const current=buckets.get(y)??{year:y,proposed:0,rejected:0,created:0,replaced:0};
  if(r.action==="reject")current.rejected++;
  else{current.proposed++;if(r.action==="create")current.created++;else current.replaced++;}
  buckets.set(y,current);
 }
 return [...buckets.values()].sort((a,b)=>a.year===null?1:b.year===null?-1:a.year-b.year);
}
