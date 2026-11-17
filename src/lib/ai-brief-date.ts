/** Display formatting only: retain original cycle instants for archival identifiers and queries. */
const localeId=(locale:string)=>locale==="en"?"en-GB":"fr-FR";
function date(value:string,zone:string){
 // Kanban dates are calendar days, not UTC instants; avoid timezone shifts.
 if(/^\d{4}-\d{2}-\d{2}$/.test(value))
  return {instant:new Date(value+"T12:00:00Z"),zone:"UTC",dateOnly:true};
 const instant=new Date(value);
 if(!Number.isFinite(instant.getTime()))return null;
 return {instant,zone,dateOnly:false};
}
export function formatBriefDateTime(value:string,zone:string,locale:string):string{
 const parsed=date(value,zone);
 if(!parsed)return value;
 try{return new Intl.DateTimeFormat(localeId(locale),{
  dateStyle:"long",...(parsed.dateOnly?{}:{timeStyle:"short"}),timeZone:parsed.zone
 }).format(parsed.instant);}
 catch{return value;}
}
export function formatBriefCycleDates(start:string,end:string,zone:string,locale:string):string{
 return formatBriefDateTime(start,zone,locale)+" — "+formatBriefDateTime(end,zone,locale)+
  " ("+zone+")";
}
