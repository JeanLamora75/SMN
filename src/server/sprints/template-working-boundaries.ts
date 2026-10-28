import {workingIntervals,resolveLocalMinute,validWorkSlots,type WorkSlots}
 from "@/server/capacity/work-slots";

export type SprintBounds={id:string;startAt:string;endAt:string;timeZone:string};
export type SprintTemplate={id:string;name:string;frequency:"daily"|"weekly"|"sprint";
 weekday:number|null;position:"start"|"end"|null;time:string;duration:number;revision:number};
export type PlannedTemplate={templateId:string;name:string;startAt:string;endAt:string;
 duration:number;position:"start"|"end"|null};
export const DEFAULT_TEAM_SLOTS:WorkSlots={
 morningStart:"09:00",morningEnd:"12:00",afternoonStart:"13:00",afternoonEnd:"18:00"
};
const MINUTE=60000;
const weekday=(date:string)=>new Date(date+"T00:00:00Z").getUTCDay()||7;
const nextDay=(date:string)=>new Date(Date.parse(date+"T00:00:00Z")+86400000).toISOString().slice(0,10);
function localDay(at:Date,zone:string){
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{
  timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hourCycle:"h23"
 }).formatToParts(at).map(x=>[x.type,x.value]));
 return parts.year+"-"+parts.month+"-"+parts.day;
}
function requestedMinute(date:string,time:string,zone:string){
 const at=resolveLocalMinute(date,time.slice(0,5),zone);
 if(at===null)throw Error("template-local-time-unavailable");
 return at;
}
type Interval={start:number;end:number};
type WorkDay={date:string;windows:Interval[]};

/** Shared by simple creation, batch confirmation and the Sprint generation wizard. */
export function planSprintTemplateOccurrences(sprint:SprintBounds,
 templates:readonly SprintTemplate[],slots:WorkSlots=DEFAULT_TEAM_SLOTS,
 blockedDates:ReadonlySet<string>=new Set()):PlannedTemplate[]{
 if(!validWorkSlots(slots))throw Error("invalid-team-work-slots");
 const sprintStart=Date.parse(sprint.startAt),sprintEnd=Date.parse(sprint.endAt);
 if(!Number.isFinite(sprintStart)||!Number.isFinite(sprintEnd)||sprintStart>=sprintEnd)
  throw Error("invalid-sprint");
 const from=localDay(new Date(sprintStart),sprint.timeZone);
 const to=localDay(new Date(sprintEnd),sprint.timeZone);
 const workDays:WorkDay[]=[];
 for(let date=from,i=0;date<=to&&i<35;date=nextDay(date),i++){
  if(weekday(date)>5||blockedDates.has(date))continue;
  const intervals=workingIntervals(date,sprint.timeZone,slots,{morning:true,afternoon:true});
  if(intervals===null)throw Error("template-local-time-unavailable");
  const windows=intervals.map(w=>({
   start:Math.max(sprintStart,w.start),end:Math.min(sprintEnd,w.end)
  })).filter(w=>w.end>w.start);
  if(windows.length)workDays.push({date,windows});
 }
 const boundary=templates.filter(t=>t.frequency==="sprint");
 if(boundary.length&&!workDays.length)throw Error("sprint-no-working-day");
 const result:Array<PlannedTemplate&Interval>=[];
 const add=(t:SprintTemplate,begin:number,finish:number)=>{
  if(begin<sprintStart||finish>sprintEnd||finish<=begin)
   throw Error("ceremony-outside-sprint");
  result.push({templateId:t.id,name:t.name,position:t.position,duration:t.duration,
   startAt:new Date(begin).toISOString(),endAt:new Date(finish).toISOString(),
   start:begin,end:finish});
 };
 const compare=(a:SprintTemplate,b:SprintTemplate)=>
  a.time.localeCompare(b.time)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
 const first=workDays[0],last=workDays.at(-1);
 if(first){
  const beginTemplates=boundary.filter(x=>x.position==="start").sort(compare);
  let cursor=first.windows[0].start;
  const firstHour=cursor+60*MINUTE;
  for(const t of beginTemplates){
   const wanted=requestedMinute(first.date,t.time,sprint.timeZone);
   const preferred=wanted>=first.windows[0].start&&wanted<firstHour?wanted:cursor;
   let slot:Interval|null=null;
   for(const window of first.windows){
    const at=Math.max(window.start,cursor,preferred);
    if(at+t.duration*MINUTE<=window.end){slot={start:at,end:at+t.duration*MINUTE};break;}
   }
   if(!slot)throw Error("sprint-start-ceremonies-overflow");
   add(t,slot.start,slot.end);cursor=slot.end;
  }
 }
 if(last){
  const endTemplates=boundary.filter(x=>x.position==="end").sort(compare).reverse();
  // Reserve the final working hour for wrapping up the day, regardless of the
  // nominal (possibly Sunday) end of the Sprint.
  let deadline=last.windows.at(-1)!.end-60*MINUTE;
  for(const t of endTemplates){
   const requested=requestedMinute(last.date,t.time,sprint.timeZone);
   let slot:Interval|null=null;
   for(const window of [...last.windows].reverse()){
    const at=Math.min(Math.max(requested,window.start),deadline-t.duration*MINUTE,window.end-t.duration*MINUTE);
    if(at>=window.start){slot={start:at,end:at+t.duration*MINUTE};break;}
   }
   if(!slot)throw Error("sprint-end-ceremonies-overflow");
   add(t,slot.start,slot.end);deadline=slot.start;
  }
 }
 // Recurring Daily/weekly templates keep their established recurrence and
 // configured times; the working-day correction applies only to Sprint anchors.
 for(let day=from,i=0;day<=to&&i<35;day=nextDay(day),i++){
  for(const template of templates){
   if(template.frequency==="sprint"||
    template.frequency==="daily"&&(weekday(day)>5||blockedDates.has(day))||
    template.frequency==="weekly"&&template.weekday!==weekday(day))continue;
   const begin=requestedMinute(day,template.time,sprint.timeZone);
   const finish=begin+template.duration*MINUTE;
   if(begin>=sprintStart&&finish<=sprintEnd)add(template,begin,finish);
  }
 }
 return result.sort((a,b)=>a.start-b.start||a.templateId.localeCompare(b.templateId))
  .map(({start:_start,end:_end,...item})=>item);
}
