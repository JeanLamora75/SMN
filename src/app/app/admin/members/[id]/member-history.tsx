"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Item={key:string;time:string;description:string};
type IdentityEvent={changedAt:string;previous:Record<string,unknown>;next:Record<string,unknown>};
type Assignment={id:string;startOn:string;endOn:string|null};
type CalendarWeek={revision:number;effective_from:string;created_at:string};
type CalendarException={revision:number;on_date:string;created_at?:string};
type Absence={id:string;reason:string;startOn:string;endOn:string;createdAt:string;updatedAt:string};
type LocationVersion={revision:number;effective_from:string;created_at:string};
async function read<T>(url:string):Promise<T>{
 const r=await fetch(url,{cache:"no-store"});
 if(!r.ok)throw Error("history-load");
 return r.json() as Promise<T>;
}
export default function MemberHistory({memberId}:{memberId:string}){
 const t=useTranslation();
 const [events,setEvents]=useState<Item[]>([]);
 const [state,setState]=useState<"loading"|"ready"|"error">("loading");
 useEffect(()=>{
  let live=true;
  const base="/api/admin/members/"+encodeURIComponent(memberId);
  const today=new Date().toISOString().slice(0,10);
  void Promise.all([
   read<{events:IdentityEvent[]}>(base+"/history"),
   read<{assignments:Assignment[];archivedAt:string|null}>(base+"/lifecycle"),
   read<{weeks:CalendarWeek[];exceptions:CalendarException[]}>(base+"/calendar"),
   read<{absences:Absence[]}>(base+"/absences?onDate="+today),
   read<{versions:LocationVersion[]}>(base+"/location")
  ]).then(([identity,lifecycle,calendar,absences,location])=>{
   if(!live)return;
   const all:Item[]=[];
   identity.events.forEach((event,i)=>{
    const changed=Object.keys(event.next??{}).filter(k=>
     JSON.stringify(event.previous?.[k])!==JSON.stringify(event.next?.[k]));
    all.push({key:"identity-"+i,time:event.changedAt,
     description:t("memberUX.historyIdentity")+(changed.length?" ("+changed.join(", ")+")":"")});
   });
   lifecycle.assignments.forEach((a,i)=>{
    all.push({key:"assignment-"+i,time:a.startOn,
     description:t("memberUX.historyAssignment")});
    if(a.endOn)all.push({key:"assignment-close-"+i,time:a.endOn,
     description:t("memberUX.historyAssignmentClosed")});
   });
   if(lifecycle.archivedAt)all.push({key:"archive",time:lifecycle.archivedAt,
    description:t("memberUX.archived")});
   calendar.weeks.forEach((v,i)=>all.push({key:"calendar-"+i,time:v.created_at??v.effective_from,
    description:t("memberUX.historyCalendar")}));
   calendar.exceptions.forEach((v,i)=>all.push({key:"exception-"+i,time:v.created_at??v.on_date,
    description:t("memberUX.historyCalendarException")}));
   absences.absences.forEach((a,i)=>all.push({key:"absence-"+i,time:a.updatedAt??a.createdAt??a.startOn,
    description:t("memberUX.historyAbsence")+(a.reason?" — "+a.reason:"")}));
   location.versions.forEach((v,i)=>all.push({key:"location-"+i,time:v.created_at??v.effective_from,
    description:t("memberUX.historyLocation")}));
   all.sort((a,b)=>b.time.localeCompare(a.time)||a.key.localeCompare(b.key));
   setEvents(all);setState("ready");
  }).catch(()=>{if(live)setState("error");});
  return()=>{live=false;};
 },[memberId,t]);
 if(state==="loading")return <p role="status">{t("memberUX.loading")}</p>;
 if(state==="error")return <p role="alert" className="alert alert-warning">{t("memberUX.loadFailed")}</p>;
 if(!events.length)return <p>{t("memberUX.emptyHistory")}</p>;
 return <ol className="list-group list-group-numbered">
  {events.map(e=><li key={e.key} className="list-group-item d-flex justify-content-between gap-3">
   <span>{e.description}</span><time className="text-secondary" dateTime={e.time}>{e.time.slice(0,10)}</time>
  </li>)}
 </ol>;
}
