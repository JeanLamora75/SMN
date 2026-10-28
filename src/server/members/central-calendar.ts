import type {TeamCalendarResponse} from "./team-calendar";
import {calendarDates} from "./team-calendar";
import {formatMemberEvent} from "./location";
import {isValidDate} from "./assignment";

export type CentralCalendarType="absence"|"closure"|"holiday"|"cycle"|"meeting";
export type MeetingStatus="scheduled"|"held"|"cancelled"|"unknown";
export type CentralCalendarItem={
 id:string;date:string;type:CentralCalendarType;
 title:string;memberId?:string;memberName?:string;
 sourceHref:string|null;categoryColor?:string;categoryName?:string;
 aggregateCount?:number;planned?:boolean;
 companyId?:string;companyName?:string;companyColor?:string;members?:{id:string;name:string}[];
 startOn?:string;endOn?:string;
 utcInstant?:string;ianaZone?:string;localTime?:string;
 meetingStatus?:MeetingStatus;
};
export type CycleSource={
 id:string;name:string;startOn:string;endOn:string;
 sourceHref:string;
};
export type MeetingSource={
 id:string;name:string;startsAtUtc:string;timeZone:string;
 status:"scheduled"|"held"|"cancelled"|null;sourceHref:string;
};
export type CentralCalendar={
 items:CentralCalendarItem[];
 types:readonly CentralCalendarType[];
 cyclesAvailable:boolean;meetingsAvailable:boolean;
};
const visibleTypes=["absence","closure","holiday","cycle","meeting"] as const;
const safeLink=(href:string)=>
 href.startsWith("/app/")&&!href.includes("..")&&!href.includes("//")?href:null;
const within=(date:string,start:string,end:string)=>date>=start&&date<=end;

/** Projection only: this read model never creates, moves or copies source records. */
export function projectCentralCalendar(
 calendar:TeamCalendarResponse,isAdmin:boolean,
 cycles:readonly CycleSource[]=[],meetings:readonly MeetingSource[]=[]
):CentralCalendar{
 const dates=calendarDates(calendar.start,calendar.days);
 if(dates.at(-1)!==calendar.end)throw Error("central-calendar-period-inconsistent");
 const seen=new Set<string>();
 const items:CentralCalendarItem[]=[];
 const add=(item:CentralCalendarItem)=>{
  const key=item.type+":"+item.id+":"+item.date;
  if(!seen.has(key)){seen.add(key);items.push(item);}
 };
 for(const day of calendar.collective){
  if(!within(day.date,calendar.start,calendar.end))continue;
  // An ordinary user only sees aggregate counts, never a name, category or motive.
  if(!isAdmin&&day.declaredAbsentMemberCount>0)add({
   id:"collective-"+day.date,date:day.date,type:"absence",
   title:"",aggregateCount:day.declaredAbsentMemberCount,
   sourceHref:"#team-calendar-collective"
  });
 }
 // Collective views may flag a holiday without disclosing any member location.
 if(!isAdmin){
  for(const day of calendar.collective){
   if(day.hasNationalHoliday)add({
    id:"national-holiday-"+day.date,date:day.date,type:"holiday",
    title:"",sourceHref:null
   });
  }
 }
 for(const closure of calendar.closures){
  for(const date of dates){
   if(within(date,closure.startOn,closure.endOn))add({
    id:closure.id,date,type:"closure",title:closure.name,
    companyId:closure.companyId,companyName:closure.companyName,companyColor:closure.companyColor,
    members:isAdmin?closure.members:[],
    startOn:closure.startOn,endOn:closure.endOn,
    sourceHref:isAdmin?"/app/admin/company-closures": "#team-calendar-collective"
   });
  }
 }
 if(isAdmin&&calendar.admin){
  for(const member of calendar.admin.members){
   for(const day of member.days){
    if(!within(day.date,calendar.start,calendar.end))continue;
    if(day.nationalHolidayName)add({
     id:"holiday-"+day.nationalHolidayName,date:day.date,type:"holiday",
     title:day.nationalHolidayName,sourceHref:"/app/admin/members"
    });
    for(const absence of day.absences)add({
     id:absence.id,date:day.date,type:"absence",title:absence.categoryName,
     memberId:member.id,memberName:member.displayName,
     categoryName:absence.categoryName,categoryColor:absence.categoryColor,
     planned:absence.isPlanned,startOn:absence.startOn,endOn:absence.endOn,
     sourceHref:"/app/admin/members"
     // The underlying reason is private, even in this shared projection.
    });
   }
  }
 }
 for(const cycle of cycles){
  if(!isValidDate(cycle.startOn)||!isValidDate(cycle.endOn)||
   cycle.startOn>cycle.endOn)throw Error("central-calendar-invalid-cycle");
  for(const date of dates){
   if(within(date,cycle.startOn,cycle.endOn))add({
    id:cycle.id,date,type:"cycle",title:cycle.name,
    startOn:cycle.startOn,endOn:cycle.endOn,
    sourceHref:safeLink(cycle.sourceHref)
   });
  }
 }
 for(const meeting of meetings){
  // Meeting dates are derived from their recorded UTC instant and IANA zone,
  // never from the browser timezone or from a guessed historical status.
  const local=formatMemberEvent(meeting.startsAtUtc,meeting.timeZone);
  const date=[local.parts.year,local.parts.month,local.parts.day].join("-");
  if(!within(date,calendar.start,calendar.end))continue;
  add({id:meeting.id,date,type:"meeting",title:meeting.name,
   sourceHref:safeLink(meeting.sourceHref),utcInstant:local.utc,
   ianaZone:local.timeZone,localTime:local.label,
   meetingStatus:meeting.status??"unknown"});
 }
 items.sort((a,b)=>a.date.localeCompare(b.date)||
  visibleTypes.indexOf(a.type)-visibleTypes.indexOf(b.type)||
  a.id.localeCompare(b.id));
 return {items,types:visibleTypes,cyclesAvailable:cycles.length>0,
  meetingsAvailable:meetings.length>0};
}
export function filterCentralCalendar(items:readonly CentralCalendarItem[],
 type:CentralCalendarType|"all",memberId:string|null=null):CentralCalendarItem[]{
 return items.filter(item=>(type==="all"||item.type===type)&&
  (!memberId||item.type!=="absence"||item.memberId===memberId));
}
