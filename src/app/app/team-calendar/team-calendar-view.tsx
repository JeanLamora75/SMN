"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import CalendarOptionB,{type CalendarEntry,type CalendarMeeting,type CalendarMode} from "./calendar-option-b";
import CalendarMeetingModal from "./calendar-meeting-modal";
import MemberAbsenceEditor from "../admin/members/member-absence-editor";
import {absenceNamesByDate,type CalendarAbsentMember} from "@/lib/calendar-absence-names";
type Calendar={team:{name:string};central:{items:CalendarEntry[]};collective:{date:string;declaredAbsentMemberCount:number}[];
 admin?:{members:CalendarAbsentMember[]}};
type Meeting=CalendarMeeting;
type MemberOption={id:string;displayName:string;archived:boolean;startOn:string|null;endOn:string|null};
type Sprint={id:string;name:string;status:string;startAt:string;endAt:string};
const iso=(d:Date)=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
function shift(day:string,amount:number){const d=new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+amount);return d.toISOString().slice(0,10);}
function dates(start:string,n:number){return Array.from({length:n},(_,i)=>shift(start,i));}
function monthStart(d:string){return d.slice(0,7)+"-01";}
function monthLength(d:string){const [y,m]=d.split("-").map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate();}
function localDate(raw:string){return iso(new Date(raw));}
export default function TeamCalendarView({isAdmin,initialCreate=false,initialCycleId=null,initialTeamId=null}:{
 isAdmin:boolean;initialCreate?:boolean;initialCycleId?:string|null;
 initialTeamId?:string|null;
}){
 const t=useTranslation(),locale=useLocale();
 const openedFromLink=useRef(false);
 function selectPeriod(next:{start:string;count:number;label:string;sprintId:string|null}){
  setStatus("loading");setPeriod(next);
 }
 const [period,setPeriod]=useState<{start:string;count:number;label:string;sprintId:string|null}|null>(null);
 const [events,setEvents]=useState<CalendarEntry[]>([]);
 const [teamName,setTeamName]=useState("");
 const [absenceCounts,setAbsenceCounts]=useState<Record<string,number>>({});
 const [absentNames,setAbsentNames]=useState<Record<string,string[]>>({});
 const [view,setView]=useState<CalendarMode>("cards");
 const [showMeetings,setShowMeetings]=useState(true);
 const [showAbsences,setShowAbsences]=useState(true);
 const [refreshToken,setRefreshToken]=useState(0);
 const [absenceEditor,setAbsenceEditor]=useState<string|null>(null);
 const [chosenMember,setChosenMember]=useState("");
 const [availableMembers,setAvailableMembers]=useState<MemberOption[]>([]);
 const [membersStatus,setMembersStatus]=useState<"loading"|"ready"|"error">("loading");
 const [meetings,setMeetings]=useState<Meeting[]>([]);
 const [selectedMeeting,setSelectedMeeting]=useState<Meeting|null>(null);
 const [sprints,setSprints]=useState<Sprint[]>([]);
 const [calendarMode,setCalendarMode]=useState<"scrum"|"kanban">("scrum");
 const [teamTimeZones,setTeamTimeZones]=useState<string[]>([]);
 const [selectedTimeZone,setSelectedTimeZone]=useState("Europe/Paris");
 const [zonesFailed,setZonesFailed]=useState(false);
 useEffect(()=>{const controller=new AbortController();void fetch("/api/team-calendar/time-zones",{cache:"no-store",signal:controller.signal})
  .then(async r=>{if(!r.ok)throw Error("time-zones");return r.json() as Promise<{timeZones:string[]}>;})
  .then(v=>{if(controller.signal.aborted)return;const zones=v.timeZones.filter(z=>{try{new Intl.DateTimeFormat("en",{timeZone:z});return true;}catch{return false;}});
   setTeamTimeZones([...new Set(zones)]);setSelectedTimeZone(current=>zones.includes(current)?current:zones[0]??"Europe/Paris");})
  .catch(()=>{if(!controller.signal.aborted)setZonesFailed(true);});return()=>controller.abort();},[]);
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
  void fetch("/api/team-calendar/periods"+(initialTeamId?"?"+new URLSearchParams({teamId:initialTeamId}):""),{cache:"no-store"}).then(async r=>{
   if(!r.ok)throw Error();return r.json() as Promise<{sprints:Sprint[];mode?:"scrum"|"kanban"}>;})
   .then(result=>{if(!live)return;const list=result.sprints??[];
    // Un cycle de lien direct doit appartenir à l'équipe filtrée.
    if(initialCycleId&&!list.some(s=>s.id===initialCycleId)){
     setStatus("error");return;
    }
    setSprints(list);setCalendarMode(result.mode??"scrum");
    const active=(initialCycleId?list.find(s=>s.id===initialCycleId):null)
      ??list.find(s=>s.status==="active"&&localDate(s.startAt)<=current&&localDate(s.endAt)>=current)
      ??list.find(s=>localDate(s.startAt)<=current&&localDate(s.endAt)>=current)
      ??list.filter(s=>localDate(s.startAt)<=current).sort((a,b)=>localDate(b.startAt).localeCompare(localDate(a.startAt)))[0]
      ??list[list.length-1];
    if(!active){selectPeriod(fallback());return;}
    const begin=localDate(active.startAt),finish=localDate(active.endAt);
    const count=Math.max(1,Math.round((new Date(finish+"T12:00:00Z").getTime()-new Date(begin+"T12:00:00Z").getTime())/86400000)+1);
    selectPeriod({start:begin,count,label:active.name,sprintId:active.id});
   }).catch(()=>{if(live)selectPeriod(fallback());});
   return()=>{live=false;};
 },[initialCycleId,initialTeamId]);
 useEffect(()=>{if(!period)return;let alive=true;
  const days=dates(period.start,period.count);
  const blocks:Array<Promise<Calendar>>=[];
  for(let i=0;i<period.count;i+=28){
   const query=new URLSearchParams({start:days[i],days:"28",...(initialTeamId?{teamId:initialTeamId}:{})});
   blocks.push(fetch("/api/team-calendar?"+query,{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("calendar");return r.json() as Promise<Calendar>;}));
  }
  const end=days[days.length-1];
  void Promise.all([Promise.all(blocks),fetch("/api/team-calendar/meetings?"+new URLSearchParams({start:period.start,end,...(initialTeamId?{teamId:initialTeamId}:{})}),{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("meetings");return r.json() as Promise<{meetings:Meeting[]}>;})])
  .then(([parts,meet])=>{if(!alive)return;
   const counts:Record<string,number>={};
   for(const p of parts){for(const day of p.collective){
    if(!Number.isSafeInteger(day.declaredAbsentMemberCount)||day.declaredAbsentMemberCount<0)throw Error("absence-count-unavailable");
    counts[day.date]=day.declaredAbsentMemberCount;
   }}
   if(days.some(day=>counts[day]===undefined))throw Error("absence-count-incomplete");
   const named:Record<string,string[]>={};
   for(const p of parts){
    const names=isAdmin?absenceNamesByDate(p.admin?.members):{};
    for(const [day,people] of Object.entries(names))named[day]=people;
   }
   setAbsenceCounts(counts);setAbsentNames(named);setTeamName(parts[0]?.team.name??"");
   setEvents(parts.flatMap(x=>x.central.items));setMeetings(meet.meetings);setStatus("ready");})
  .catch(()=>{if(alive)setStatus("error");});return()=>{alive=false;};
 },[period,refreshToken,isAdmin,initialTeamId]);
 function sprintPeriod(s:Sprint){
  const start=localDate(s.startAt),finish=localDate(s.endAt);
  return {start,count:Math.max(1,Math.round((new Date(finish+"T12:00:00Z").getTime()-new Date(start+"T12:00:00Z").getTime())/86400000)+1),label:s.name,sprintId:s.id};
 }
 function change(direction:number){
  if(!period)return;
  if(period.sprintId){
   const index=sprints.findIndex(s=>s.id===period.sprintId);
   const other=sprints[index-direction];
   if(other){selectPeriod(sprintPeriod(other));return;}
  }
  const next=shift(period.start,direction*period.count);
  selectPeriod({start:monthStart(next),count:monthLength(next),label:next.slice(0,7),sprintId:null});
 }
 function resetPeriod(){
  const active=sprints.find(s=>localDate(s.startAt)<=now&&localDate(s.endAt)>=now);
  if(active){selectPeriod(sprintPeriod(active));return;}
  selectPeriod({start:monthStart(now),count:monthLength(now),label:now.slice(0,7),sprintId:null});
 }
 const openCreate=useCallback((day:string)=>{
  setEditor(day);setWhen(day+"T09:00");setName("");setDuration(60);setSaveError("");
 },[]);
 // Le raccourci du tableau de bord ouvre une seule fois le formulaire existant.
 // Le Sprint demandé doit provenir de la liste autorisée par l’API calendrier.
 useEffect(()=>{
  if(calendarMode==="kanban"||!isAdmin||!initialCreate||openedFromLink.current||status!=="ready"||!period)return;
  const sprint=sprints.find(s=>s.id===period.sprintId);
  if(!sprint||sprint.status==="closed"||(initialCycleId&&sprint.id!==initialCycleId))return;
  const start=localDate(sprint.startAt),end=localDate(sprint.endAt);
  const today=iso(new Date());
  const day=today>=start&&today<=end?today:start;
  let alive=true;
  queueMicrotask(()=>{
   if(!alive||openedFromLink.current)return;
   openedFromLink.current=true;
   openCreate(day);
  });
  return()=>{alive=false;};
 },[calendarMode,isAdmin,initialCreate,initialCycleId,period,status,sprints,openCreate]);
 const selectedDate=when.slice(0,10);
 const selectedSprint=sprints.find(x=>x.status!=="closed"&&localDate(x.startAt)<=selectedDate&&selectedDate<=localDate(x.endAt));
 async function save(){if(!period||!editor||!name.trim()||busy||(calendarMode==="scrum"&&!selectedSprint))return;
  setBusy(true);setSaveError("");
  try{const date=new Date(when);if(Number.isNaN(date.valueOf()))throw Error("date");
   const r=await fetch(calendarMode==="kanban"?"/api/admin/kanban-meetings":"/api/admin/sprints/exceptional-meetings",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(calendarMode==="kanban"?{name:name.trim(),periodId:period.sprintId,duration,startAt:date.toISOString()}:{name:name.trim(),sprintId:selectedSprint!.id,duration,startAt:date.toISOString()})});
   if(!r.ok)throw Error("save");
   setEditor(null);
   const end=shift(period.start,period.count-1);
   const refresh=await fetch("/api/team-calendar/meetings?"+new URLSearchParams({start:period.start,end,...(initialTeamId?{teamId:initialTeamId}:{})}),{cache:"no-store"});
   if(refresh.ok)setMeetings((await refresh.json() as {meetings:Meeting[]}).meetings);
  }catch{setSaveError(t("calendarUX.saveFailed"));}finally{setBusy(false);}
 }
 const all=period?dates(period.start,period.count):[];
 const currentDate=(day:string)=>new Intl.DateTimeFormat(locale,{
  timeZone:"UTC",day:"numeric",month:"long",year:"numeric"
 }).format(new Date(day+"T12:00:00Z"));
 const localizedStatus=(status:string|undefined)=>{
  if(status==="active")return t("calendarOptionB.statusActive");
  if(status==="planned")return t("calendarOptionB.statusPlanned");
  if(status==="closed")return t("calendarOptionB.statusClosed");
  if(status==="suspended")return t("calendarOptionB.statusSuspended");
  return status??"";
 };
 const isEditable=useCallback((day:string)=>{
  if(!isAdmin||[0,6].includes(new Date(day+"T12:00:00Z").getUTCDay()))return false;
  return sprints.some(s=>s.status!=="closed"&&localDate(s.startAt)<=day&&localDate(s.endAt)>=day);
 },[isAdmin,sprints]);
 useEffect(()=>{
  if(!absenceEditor||!isAdmin)return;
  let alive=true;
  void fetch("/api/admin/members"+(initialTeamId?"?"+new URLSearchParams({teamId:initialTeamId}):""),{cache:"no-store"}).then(async r=>{
   if(!r.ok)throw Error("members");
   return r.json() as Promise<{members:MemberOption[]}>;
  }).then(data=>{
   if(!alive)return;
   setAvailableMembers(data.members.filter(m=>!m.archived&&m.startOn!==null&&m.startOn<=absenceEditor&&
    (m.endOn===null||m.endOn>=absenceEditor)));
   setMembersStatus("ready");
  }).catch(()=>{if(alive)setMembersStatus("error");});
  return()=>{alive=false;};
 },[absenceEditor,isAdmin]);
 return <main className="smn-page smn-team-page smn-calendar-option-b container-fluid py-4 px-3 px-lg-4 d-grid gap-3">
  <div className="smn-cal-page-heading">
   <div>
    <div className="smn-cal-eyebrow">{t("calendarOptionB.eyebrow")}</div>
    <h1 className="h3 mb-2">{t("teamCalendar.title")}</h1>
    <div className="smn-cal-context">
     {teamName&&<strong>{teamName}</strong>}
     <strong>{period?.sprintId?period.label:t("calendarOptionB.fallback")}</strong>
     {calendarMode==="kanban"&&<span>Période Kanban</span>}
     {period&&<span>{currentDate(period.start)} – {currentDate(shift(period.start,period.count-1))}</span>}
     {period?.sprintId&&<span className="smn-cal-state">{localizedStatus(sprints.find(s=>s.id===period.sprintId)?.status)}</span>}
     {teamTimeZones.length<=1?<span>Fuseau : {teamTimeZones[0]??"Europe/Paris"}</span>:<label className="d-inline-flex align-items-center gap-2">Fuseau horaire
      <select className="form-select form-select-sm" aria-label="Fuseau horaire du calendrier" value={selectedTimeZone} onChange={e=>setSelectedTimeZone(e.target.value)}>
       {teamTimeZones.map(z=><option key={z} value={z}>{z}</option>)}
      </select></label>}
     {zonesFailed&&<span className="text-warning">Fuseaux membres indisponibles — Europe/Paris</span>}
    </div>
   </div>
   <div className="smn-cal-nav">
    {sprints.length>0&&<select className="form-select form-select-sm smn-cal-select"
      aria-label={t("calendarOptionB.selectSprint")} value={period?.sprintId??""}
      onChange={e=>{const selected=sprints.find(s=>s.id===e.target.value);if(selected)selectPeriod(sprintPeriod(selected));}}>
      <option value="" disabled>{t("calendarOptionB.selectSprint")}</option>
      {sprints.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
     </select>}
    <button className="btn btn-outline-secondary btn-sm" aria-label={t("calendarOptionB.previous")}
      disabled={!period} onClick={()=>change(-1)}>‹</button>
    <button className="btn btn-outline-primary btn-sm" onClick={resetPeriod}>{t("calendarOptionB.today")}</button>
    <button className="btn btn-outline-secondary btn-sm" aria-label={t("calendarOptionB.next")}
      disabled={!period} onClick={()=>change(1)}>›</button>
   </div>
  </div>
  <div className="smn-cal-toolbar">
   <div className="smn-cal-control-group"><strong>{t("calendarOptionB.display")}</strong>
    <button type="button" className={"smn-cal-chip"+(showMeetings?" is-selected":"")} aria-pressed={showMeetings}
      onClick={()=>setShowMeetings(v=>!v)}>{t("calendarOptionB.meetings")}</button>
    <button type="button" className={"smn-cal-chip"+(showAbsences?" is-selected":"")} aria-pressed={showAbsences}
      onClick={()=>setShowAbsences(v=>!v)}>{t("calendarOptionB.absenceFilter")}</button>
   </div>
   <div className="smn-cal-control-group"><strong>{t("calendarOptionB.presentation")}</strong>
    <div className="smn-cal-switch" role="group" aria-label={t("calendarOptionB.presentation")}>
     <button type="button" className={view==="cards"?"is-active":""} aria-pressed={view==="cards"}
       onClick={()=>setView("cards")}>{t("calendarOptionB.cards")}</button>
     <button type="button" className={view==="agenda"?"is-active":""} aria-pressed={view==="agenda"}
       onClick={()=>setView("agenda")}>{t("calendarOptionB.agenda")}</button>
    </div>
   </div>
  </div>
  <p className="smn-cal-legend">
   <span>{t("calendarOptionB.legendToday")}</span>
   <span>{t("calendarOptionB.legendNonwork")}</span>
   <span>{t("calendarOptionB.legendActions")}</span>
  </p>
  {status==="loading"&&<p role="status">{t("teamCalendar.loading")}</p>}
  {status==="error"&&<p role="alert" className="alert alert-warning">{t("teamCalendar.loadFailed")} — {t("calendarOptionB.errorCounts")}</p>}
  {status==="ready"&&<CalendarOptionB days={all} entries={events} meetings={meetings}
   absenceCounts={absenceCounts} absentNames={absentNames} today={now} mode={view} timeZone={selectedTimeZone}
   showMeetings={showMeetings} showAbsences={showAbsences} isEditable={isEditable}
   onMeeting={openCreate} onOpenEvent={setSelectedMeeting}
   onAbsence={day=>{setChosenMember("");setAvailableMembers([]);setMembersStatus("loading");setAbsenceEditor(day);}}/>}
  {selectedMeeting&&selectedMeeting.kind==="kanban"&&<div className="smn-member-modal-backdrop" role="presentation"><div className="smn-member-modal p-4" role="dialog" aria-modal="true" aria-label="Réunion Kanban"><h2 className="h5">{selectedMeeting.name}</h2><p>{selectedMeeting.startAt} — {selectedMeeting.endAt}</p><p>Statut : {selectedMeeting.status??"Non renseigné"}</p><button className="btn btn-outline-secondary" onClick={()=>setSelectedMeeting(null)}>Fermer</button></div></div>}
  {selectedMeeting&&selectedMeeting.kind!=="kanban"&&<CalendarMeetingModal key={selectedMeeting.kind+":"+selectedMeeting.id}
   meeting={selectedMeeting} isAdmin={isAdmin} onClose={()=>setSelectedMeeting(null)}
   onSaved={()=>{setStatus("loading");setRefreshToken(n=>n+1);}}/>}
  {absenceEditor&&<div className="smn-member-modal-backdrop" role="presentation">
   <div className="smn-member-modal p-4" role="dialog" aria-modal="true"
    aria-labelledby="calendar-absence-title">
    <h2 className="h5" id="calendar-absence-title">{t("calendarOptionB.absenceCreate")}</h2>
    <label className="form-label" htmlFor="calendar-absence-member">{t("calendarOptionB.chooseMember")}</label>
    {membersStatus==="loading"&&<p role="status">{t("calendarOptionB.loadingMembers")}</p>}
    {membersStatus==="error"&&<p role="alert">{t("calendarOptionB.membersFailed")}</p>}
    {membersStatus==="ready"&&!chosenMember&&<select autoFocus id="calendar-absence-member" className="form-select mb-3"
     value={chosenMember} onChange={e=>setChosenMember(e.target.value)}>
      <option value="">{t("calendarOptionB.chooseMemberPlaceholder")}</option>
      {availableMembers.map(m=><option key={m.id} value={m.id}>{m.displayName}</option>)}
    </select>}
    {chosenMember&&<p className="fw-semibold mb-2">{availableMembers.find(m=>m.id===chosenMember)?.displayName}</p>}
    {chosenMember&&<MemberAbsenceEditor key={chosenMember+absenceEditor} memberId={chosenMember}
     initialDate={absenceEditor} record={null}
     onSaved={()=>{setAbsenceEditor(null);setStatus("loading");setRefreshToken(n=>n+1);}}
     onCancel={()=>setAbsenceEditor(null)}/>}
    {!chosenMember&&<div className="d-flex justify-content-end mt-3">
     <button type="button" className="btn btn-outline-secondary"
      onClick={()=>setAbsenceEditor(null)}>{t("calendarOptionB.close")}</button>
    </div>}
   </div>
  </div>}
  {editor&&<div className="smn-member-modal-backdrop" role="presentation">
   <div className="smn-member-modal p-4" role="dialog" aria-modal="true" aria-labelledby="new-meeting-heading">
    <h2 className="h5" id="new-meeting-heading">{t("calendarUX.addMeeting")}</h2>
    {calendarMode==="scrum"&&!selectedSprint&&<p className="alert alert-info">{t("calendarUX.requiresSprint")}</p>}
    <form onSubmit={e=>{e.preventDefault();void save();}} className="d-grid gap-3">
     <label className="form-label">{t("calendarUX.meetingName")}<input className="form-control" value={name} maxLength={160} required onChange={e=>setName(e.target.value)} disabled={busy}/></label>
     <label className="form-label">{t("calendarUX.startTime")}<input type="datetime-local" className="form-control" value={when} onChange={e=>setWhen(e.target.value)} required disabled={busy}/></label>
     <label className="form-label">{t("calendarUX.duration")}<input type="number" className="form-control" min={1} max={480} value={duration} onChange={e=>setDuration(Number(e.target.value))} required disabled={busy}/></label>
     {saveError&&<p role="alert" className="alert alert-warning">{saveError}</p>}
     <div className="d-flex gap-2 justify-content-end"><button type="button" className="btn btn-outline-secondary" onClick={()=>setEditor(null)}>{t("teamUX.cancel")}</button>
      <button className="btn btn-primary" disabled={busy||(calendarMode==="scrum"&&!selectedSprint)||!period?.sprintId}>{t("calendarUX.create")}</button></div>
    </form>
   </div>
  </div>}
 </main>;
}
