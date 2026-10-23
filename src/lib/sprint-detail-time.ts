/** Local wall clock for the Sprint IANA zone; never use the browser timezone. */
const clock=(zone:string)=>new Intl.DateTimeFormat("en-GB",{
 timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",
 hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"
});
function parts(value:Date,formatter:Intl.DateTimeFormat):string{
 const entries=Object.fromEntries(formatter.formatToParts(value).map(x=>[x.type,x.value]));
 return entries.year+"-"+entries.month+"-"+entries.day+"T"+
  entries.hour+":"+entries.minute+":"+entries.second;
}
export function sprintZonedInput(iso:string,zone:string):string|null{
 const d=new Date(iso);
 if(!Number.isFinite(d.getTime()))return null;
 try{return parts(d,clock(zone));}catch{return null;}
}
export type ZonedInputResult={ok:true;iso:string}|
 {ok:false;error:"invalid"|"nonexistent"|"ambiguous"};
/** DST overlap is ambiguous: refuse, rather than move a meeting to the wrong hour. */
export function sprintZonedToIso(local:string,zone:string,previousIso?:string):ZonedInputResult{
 const input=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local);
 if(!input)return {ok:false,error:"invalid"};
 const normalized=local.length===16?local+":00":local;
 if(previousIso&&sprintZonedInput(previousIso,zone)===normalized)
  return {ok:true,iso:previousIso};
 const m=input;
 if(!m)return {ok:false,error:"invalid"};
 const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
 const hour=Number(m[4]),minute=Number(m[5]),second=Number(m[6]??"0");
 if(year<100||year>9999)return {ok:false,error:"invalid"};
 const localMs=Date.UTC(year,month-1,day,hour,minute,second);
 if(!Number.isFinite(localMs)||new Date(localMs).toISOString().slice(0,19)!==normalized)
  return {ok:false,error:"invalid"};
 let fmt:Intl.DateTimeFormat;
 try{fmt=clock(zone);}catch{return {ok:false,error:"invalid"};}
 const candidates:string[]=[];
 for(let offset=-840;offset<=840;offset+=15){
  const instant=new Date(localMs-offset*60_000);
  if(parts(instant,fmt)===normalized)candidates.push(instant.toISOString());
 }
 if(candidates.length===0)return {ok:false,error:"nonexistent"};
 if(candidates.length>1)return {ok:false,error:"ambiguous"};
 return {ok:true,iso:candidates[0]};
}
