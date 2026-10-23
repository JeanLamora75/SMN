import type {SprintContextItem} from "./sprint-context";

export type TodayPolicy="include-today"|"exclude-today";
export type DayCounter=Readonly<{
 days:number;
 phase:"upcoming"|"running"|"ended";
 policy:TodayPolicy;
}>;

function dateInZone(at:Date,zone:string):string{
 const parts=new Intl.DateTimeFormat("en-GB",{
  year:"numeric",month:"2-digit",day:"2-digit",timeZone:zone
 }).formatToParts(at);
 const part=(type:string)=>parts.find(p=>p.type===type)?.value??"";
 return `${part("year")}-${part("month")}-${part("day")}`;
}
function nextDay(day:string){
 return new Date(Date.parse(day+"T00:00:00Z")+86400000).toISOString().slice(0,10);
}
function weekDay(day:string){
 const n=new Date(day+"T00:00:00Z").getUTCDay();
 return n>=1&&n<=5;
}
/**
 * Jours lundi–vendredi, sans conversion en capacité humaine.
 * [startAt,endAt) est interprété en instants UTC puis jours CIVILS locaux.
 * La politique d'inclusion d'aujourd'hui est explicite car elle n'a pas encore
 * été arbitrée par le Product Manager. Les jours fériés/fermetures ne sont
 * PAS déduits du calendrier de référence Mon–Ven de cette carte MVP.
 */
export function sprintWorkingDaysRemaining(
 sprint:Pick<SprintContextItem,"startAt"|"endAt"|"timeZone">,
 at:Date,
 policy:TodayPolicy
):DayCounter{
 const start=new Date(sprint.startAt),end=new Date(sprint.endAt);
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||
  !Number.isFinite(at.getTime())||start>=end)throw Error("invalid-sprint-period");
 const first=dateInZone(start,sprint.timeZone);
 const last=dateInZone(new Date(end.getTime()-1),sprint.timeZone);
 const today=dateInZone(at,sprint.timeZone);
 const phase=at<start?"upcoming":at>=end?"ended":"running";
 if(phase==="ended")return {days:0,phase,policy};
 const starting=phase==="upcoming"?first:
   policy==="include-today"?today:nextDay(today);
 let days=0;
 for(let date=starting;date<=last;date=nextDay(date)){
  // borne defensive contre dates corrompues ou boucles infinies
  if(days>366)throw Error("sprint-count-exceeds-limit");
  if(weekDay(date))days++;
 }
 return {days,phase,policy};
}
