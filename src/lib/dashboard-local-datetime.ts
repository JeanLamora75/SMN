/** Dates de formulaire dans le fuseau de l'équipe, jamais dans celui du navigateur. */
function parts(instant:Date,zone:string){
 const tokens=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",
  month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(instant);
 const x=Object.fromEntries(tokens.map(p=>[p.type,p.value]));
 return x.year+"-"+x.month+"-"+x.day+"T"+x.hour+":"+x.minute;
}
export function dashboardLocalValue(iso:string,zone:string){
 try{return parts(new Date(iso),zone);}catch{return "";}
}
export function dashboardLocalToIso(local:string,zone:string,original?:string):string|null{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))return null;
 const base=Date.parse(local+":00Z");
 if(!Number.isFinite(base))return null;
 const matches:string[]=[];
 for(let minutes=-14*60;minutes<=14*60;minutes+=15){
  const at=new Date(base+minutes*60000);
  if(parts(at,zone)===local)matches.push(at.toISOString());
 }
 if(matches.length===1)return matches[0];
 if(matches.length>1&&original){
  const previous=Date.parse(original);
  const candidate=matches.find(x=>Date.parse(x)===previous);
  if(candidate)return candidate;
 }
 // Une heure DST ambiguë sans correspondance explicite doit être refusée.
 return null;
}
