"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useTranslation} from "@/i18n/client";
type Item={id:string;date:string;type:"absence"|"closure"|"holiday"|"cycle"|"meeting";title:string;sourceHref:string|null;memberName?:string;aggregateCount?:number};
type Calendar={team:{name:string};central:{items:Item[]};collective:{date:string}[]};
type Meeting={id:string;name:string;startAt:string;endAt:string;kind:string;href:string};
type Sprint={id:string;name:string;status:string;startAt:string;endAt:string};
const iso=(d:Date)=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function shift(day:string,amount:number){const d=new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+amount);return d.toISOString().slice(0,10);}
function dates(start:string,n:number){return Array.from({length:n},(_,i)=>shift(start,i));}
function monthStart(d:string){return d.slice(0,7)+"-01";}
function monthLength(d:string){const [y,m]=d.split("-").map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate();}
function localDate(raw:string){return iso(new Date(raw));}
function calendarDate(instant:string){const d=new Date(instant);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function clock(raw:string){return new Date(raw).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});}
export default function TeamCalendarView({isAdmin}:{isAdmin:boolean}){
 const t=useTranslation();
 const [period,setPeriod]=useState<{start:string;count:number;label:string;sprintId:string|null}|null>(null);
 const [events,setEvents]=useState<Item[]>([]);
 const [meetings,setMeetings]=useState<Meeting[]>([]);
 const [sprints,setSprints]=useState<Sprint[]>([]);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [editor,setEditor]=useState<string|null>(null);
 const [name,setName]=useState("");
 const [when,setWhen]=useState("");
 const [duration,setDuration]=useState(60);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState("");
 const now=iso(new Date());
 useEffect(()=>{let live=true;const current=iso(new Date());
  const fallback=()=>({start:monthStart(current),count:monthLength(current),label:current.slice(0,7),sprintId:null});
  void fetch("/api/team-calendar/periods",{cache:"no-store"}).then(async r=>{
   if(!r.ok)throw Error();return r.json() as Promise<{sprints:Sprint[]}>;})
   .then(result=>{if(!live)return;const list=result.sprints??[];setSprints(list);
    const active=list.find(s=>s.status==="active"&&localDate(s.startAt)<=current&&localDate(s.endAt)>=current)
      ??list.find(s=>localDate(s.startAt)<=current&&localDate(s.endAt)>=current)
      ??list[0];
    if(!active){setPeriod(fallback());return;}
    const begin=localDate(active.startAt),finish=localDate(active.endAt);
    const count=Math.max(1,Math.ceil((new Date(finish+"T12:00:00Z").getTime()-new Date(begin+"T12:00:00Z").getTime())/86400000));
    setPeriod({start:begin,count,label:active.name,sprintId:active.id});
   }).catch(()=>{if(live)setPeriod(fallback());});
   return()=>{live=false;};
 },[]);
 useEffect(()=>{if(!period)return;let alive=true;setStatus("loading");
  const days=dates(period.start,period.count);
  const blocks:Array<Promise<Calendar>>=[];
  for(let i=0;i<period.count;i+=28){
   const query=new URLSearchParams({start:days[i],days:"28"});
   blocks.push(fetch("/api/team-calendar?"+query,{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("calendar");return r.json() as Promise<Calendar>;}));
  }
  const end=days[days.length-1];
  void Promise.all([Promise.all(blocks),fetch("/api/team-calendar/meetings?"+new URLSearchParams({start:period.start,end}),{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("meetings");return r.json() as Promise<{meetings:Meeting[]}>;})])
  .then(([parts,meet])=>{if(!alive)return;setEvents(parts.flatMap(x=>x.central.items));setMeetings(meet.meetings);setStatus("ready");})
  .catch(()=>{if(alive)setStatus("error");});return()=>{alive=false;};
 },[period]);
 function change(direction:number){if(!period)return;
  const next=shift(period.start,direction*period.count);
  setPeriod({start:monthStart(next),count:monthLength(next),label:next.slice(0,7),sprintId:null});
 }
 function openCreate(day:string){setEditor(day);setWhen(day+"T09:00");setName("");setDuration(60);setSaveError("");}
 const selectedDate=when.slice(0,10);
 const selectedSprint=sprints.find(x=>x.status!=="closed"&&localDate(x.startAt)<=selectedDate&&selectedDate<localDate(x.endAt));
 async function save(){if(!period||!selectedSprint||!editor||!name.trim()||busy)return;
  setBusy(true);setSaveError("");
  try{const date=new Date(when);if(Number.isNaN(date.valueOf()))throw Error("date");
   const r=await fetch("/api/admin/sprints/exceptional-meetings",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:name.trim(),sprintId:selectedSprint.id,duration,startAt:date.toISOString()})});
   if(!r.ok)throw Error("save");
   setEditor(null);
   const end=shift(period.start,period.count-1);
   const refresh=await fetch("/api/team-calendar/meetings?"+new URLSearchParams({start:period.start,end}),{cache:"no-store"});
   if(refresh.ok)setMeetings((await refresh.json() as {meetings:Meeting[]}).meetings);
  }catch{setSaveError(t("calendarUX.saveFailed"));}finally{setBusy(false);}
 }
 const all=period?dates(period.start,period.count):[];
 const dayFormat=new Intl.DateTimeFormat(undefined,{day:"numeric",month:"short"});
 const weekdayFormat=new Intl.DateTimeFormat(undefined,{weekday:"short"});
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4 d-grid gap-3">
  <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
   <div><h1 className="h3 mb-1">{t("teamCalendar.title")}</h1><p className="text-secondary mb-0">{period?.label??""}</p></div>
   <div className="d-flex gap-2"><button className="btn btn-outline-secondary" onClick={()=>change(-1)} disabled={!period}>←</button>
    <button className="btn btn-outline-secondary" onClick={()=>setPeriod({start:monthStart(now),count:monthLength(now),label:now.slice(0,7),sprintId:null})}>{t("teamCalendar.today")}</button>
    <button className="btn btn-outline-secondary" onClick={()=>change(1)} disabled={!period}>→</button></div>
  </div>
  {status==="loading"&&<p role="status">{t("teamCalendar.loading")}</p>}
  {status==="error"&&<p role="alert" className="alert alert-warning">{t("teamCalendar.loadFailed")}</p>}
  {status==="ready"&&<div className="smn-calendar-grid">
   {all.map(date=>{const d=new Date(date+"T12:00:00Z");const weekend=d.getUTCDay()===0||d.getUTCDay()===6;
    const matching=events.filter(e=>e.date===date);
    const holiday=matching.find(e=>e.type==="holiday");
    const meetingsToday=meetings.filter(m=>calendarDate(m.startAt)===date)
     .sort((a,b)=>new Date(a.startAt).getTime()-new Date(b.startAt).getTime());
    return <article key={date} className={"smn-calendar-day"+(weekend||holiday?" is-nonwork":"")+(date===now?" is-today":"")}>
     <header className="d-flex justify-content-between align-items-start gap-2">
      <div><div className="small text-secondary">{weekdayFormat.format(d)}</div>
       <div className="fw-bold">{dayFormat.format(d)}</div></div>
      {isAdmin&&<button type="button" className="btn btn-sm btn-outline-primary" aria-label={t("calendarUX.addMeeting")}
        onClick={()=>openCreate(date)}>+</button>}
     </header>
     <div className="smn-calendar-holiday">{holiday?.title??"\u00a0"}</div>
     <ul className="list-unstyled smn-calendar-meetings mb-0">
      {meetingsToday.map(m=><li key={m.kind+":"+m.id} title={clock(m.startAt)+" — "+clock(m.endAt)}>
       <Link href={m.href}>{m.name}</Link></li>)}
      {matching.filter(e=>e.type!=="holiday"&&e.type!=="meeting").map(e=><li key={e.type+":"+e.id} className="small text-secondary">
       {e.sourceHref?.startsWith("/app/")?<Link href={e.sourceHref}>{e.title||e.type}</Link>:e.title||e.type}
      </li>)}
     </ul>
    </article>;
   })}
  </div>}
  {editor&&<div className="smn-member-modal-backdrop" role="presentation">
   <div className="smn-member-modal p-4" role="dialog" aria-modal="true" aria-labelledby="new-meeting-heading">
    <h2 className="h5" id="new-meeting-heading">{t("calendarUX.addMeeting")}</h2>
    {!selectedSprint&&<p className="alert alert-info">{t("calendarUX.requiresSprint")}</p>}
    <form onSubmit={e=>{e.preventDefault();void save();}} className="d-grid gap-3">
     <label className="form-label">{t("calendarUX.meetingName")}<input className="form-control" value={name} maxLength={160} required onChange={e=>setName(e.target.value)} disabled={busy}/></label>
     <label className="form-label">{t("calendarUX.startTime")}<input type="datetime-local" className="form-control" value={when} onChange={e=>setWhen(e.target.value)} required disabled={busy}/></label>
     <label className="form-label">{t("calendarUX.duration")}<input type="number" className="form-control" min={1} max={480} value={duration} onChange={e=>setDuration(Number(e.target.value))} required disabled={busy}/></label>
     {saveError&&<p role="alert" className="alert alert-warning">{saveError}</p>}
     <div className="d-flex gap-2 justify-content-end"><button type="button" className="btn btn-outline-secondary" onClick={()=>setEditor(null)}>{t("teamUX.cancel")}</button>
      <button className="btn btn-primary" disabled={busy||!selectedSprint}>{t("calendarUX.create")}</button></div>
    </form>
   </div>
  </div>}
 </main>;
}
