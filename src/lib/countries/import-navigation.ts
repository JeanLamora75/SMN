import type {ImportPreview} from "./holiday-import";
export type ImportOutcome={
 committed:boolean;created:number;replaced:number;rejected:number;
 changedYears:number[];examinedYears:number[];yearsVerified:boolean;
};
const validYear=(x:unknown):x is number=>
 typeof x==="number"&&Number.isInteger(x)&&x>=1900&&x<=2200;
const dateYear=(s:string):number|null=>{
 if(!/^\d{4}-\d{2}-\d{2}$/u.test(s))return null;
 const value=Number(s.slice(0,4));
 return validYear(value)?value:null;
};
export function importExaminedYears(preview:ImportPreview):number[]{
 return [...new Set(preview.rows.flatMap(row=>{
  const y=dateYear(row.date);return y===null?[]:[y];
 }))].sort((a,b)=>b-a);
}
export function importProposedYears(preview:ImportPreview):number[]{
 return [...new Set(preview.rows.flatMap(row=>{
  const y=dateYear(row.date);
  return row.action==="reject"||y===null?[]:[y];
 }))].sort((a,b)=>b-a);
}
/** The server's committed years take precedence over the client's projected years. */
export function parseCommittedImport(raw:unknown,preview:ImportPreview):ImportOutcome|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const value=raw as Record<string,unknown>;
 if(value.ok!==true||!Number.isSafeInteger(value.created)||!Number.isSafeInteger(value.replaced)||
  Number(value.created)<0||Number(value.replaced)<0||
  Number(value.created)+Number(value.replaced)!==preview.proposed)return null;
 const proposed=importProposedYears(preview);
 const known=Array.isArray(value.changedYears)&&
  value.changedYears.every(validYear)&&
  new Set(value.changedYears).size===value.changedYears.length&&
  value.changedYears.every(y=>proposed.includes(y))&&
  (preview.proposed===0?value.changedYears.length===0:value.changedYears.length>0);
 return {committed:true,created:value.created as number,replaced:value.replaced as number,
  rejected:preview.rejected,changedYears:known?
   [...value.changedYears as number[]].sort((a,b)=>b-a):[],
  examinedYears:importExaminedYears(preview),yearsVerified:known};
}
/** No-op files do not need a write request just to inspect the calendars. */
export function unchangedImport(preview:ImportPreview):ImportOutcome{
 return {committed:false,created:0,replaced:0,rejected:preview.rejected,
  changedYears:[],examinedYears:importExaminedYears(preview),yearsVerified:true};
}
export function primaryYear(outcome:ImportOutcome,currentYear:number):number{
 return outcome.changedYears[0]??currentYear;
}
export function navigableImportYears(outcome:ImportOutcome):number[]{
 return outcome.committed&&outcome.changedYears.length>0?
  outcome.changedYears:outcome.examinedYears;
}
