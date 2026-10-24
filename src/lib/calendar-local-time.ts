/** Resolve a wall-clock time without silently choosing one of two DST instants. */
export function resolveCalendarLocalTime(local:string,zone:string):string|null{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))return null;
 const base=new Date(local+":00Z");
 if(!Number.isFinite(base.valueOf())||base.toISOString().slice(0,16)!==local)return null;
 let formatter:Intl.DateTimeFormat;
 try{formatter=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});}
 catch{return null;}
 const matches:string[]=[];
 for(let offset=-14*60;offset<=14*60;offset+=15){
  const date=new Date(base.getTime()+offset*60000);
  const parts=Object.fromEntries(formatter.formatToParts(date).map(x=>[x.type,x.value]));
  if(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`===local){
   matches.push(date.toISOString());
   if(matches.length>1)return null;
  }
 }
 return matches[0]??null;
}
export function formatCalendarLocalTime(instant:string,zone:string):string{
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{
  timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
 }).formatToParts(new Date(instant)).map(x=>[x.type,x.value]));
 return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Duration is calculated from actual instants (including a DST transition). */
export function durationBetweenLocal(start:string,end:string,zone:string):number|null{
 const first=resolveCalendarLocalTime(start,zone);
 const last=resolveCalendarLocalTime(end,zone);
 if(!first||!last)return null;
 const minutes=(Date.parse(last)-Date.parse(first))/60000;
 return Number.isSafeInteger(minutes)&&minutes>0?minutes:null;
}
