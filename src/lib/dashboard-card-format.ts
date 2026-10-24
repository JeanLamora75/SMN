import type {DashboardEvent} from "./dashboard-data-contract";
import type {Language} from "./language";

/** Une réunion exceptionnelle ou un modèle inconnu garde l'icône générique. */
export function dashboardEventIcon(event:Pick<DashboardEvent,"kind"|"title">):
 "people-fill"|"calendar-check"|"bar-chart-line"|"chat-dots"|"sliders"|"calendar-event" {
 if(event.kind==="exceptional")return "calendar-event";
 const title=event.title.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(/daily|melee|stand.?up|scrum quotidien/.test(title))return "people-fill";
 if(/planning|planification/.test(title))return "calendar-check";
 if(/review|revue/.test(title))return "bar-chart-line";
 if(/retrospective|retro/.test(title))return "chat-dots";
 if(/refin|affin|groom/.test(title))return "sliders";
 return "calendar-event";
}

function formatter(locale:Language,timeZone:string,options:Intl.DateTimeFormatOptions){
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{timeZone,...options});
}
/** Les instants sont convertis dans le fuseau du Sprint avant la comparaison des jours. */
export function formatDashboardEventPeriod(start:string,end:string,locale:Language,timeZone:string):string {
 try{
  const a=new Date(start),b=new Date(end);
  if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime())||b<=a)return "—";
  const dateFmt=formatter(locale,timeZone,{weekday:"short",day:"numeric",month:"short"});
  const timeFmt=formatter(locale,timeZone,{hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  const keyFmt=formatter(locale,timeZone,{year:"numeric",month:"2-digit",day:"2-digit"});
  const date=(value:Date)=>{const raw=dateFmt.format(value);return raw[0].toUpperCase()+raw.slice(1);};
  const startPart=date(a)+" : "+timeFmt.format(a);
  const endPart=keyFmt.format(a)===keyFmt.format(b)?timeFmt.format(b):
   date(b)+" : "+timeFmt.format(b);
  return startPart+" — "+endPart;
 }catch{return "—";}
}

export function formatDashboardRegistryDate(date:string,locale:Language):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return date;
 const value=new Date(date+"T12:00:00Z");
 if(!Number.isFinite(value.getTime()))return date;
 return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone:"UTC",day:"numeric",month:"short",year:"numeric"
 }).format(value);
}
