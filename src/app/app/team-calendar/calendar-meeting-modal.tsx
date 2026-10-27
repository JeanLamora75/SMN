"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useTranslation} from "@/i18n/client";
import {formatCalendarLocalTime,resolveCalendarLocalTime,durationBetweenLocal} from "@/lib/calendar-local-time";
import type {CalendarMeetingDetail} from "@/server/sprints/calendar-meeting-detail";
import type {MeetingOutcome,MeetingOutcomeType} from "@/server/sprints/calendar-meeting-outcomes";
import type {CalendarMeeting} from "./calendar-option-b";
import BootstrapIcon from "../bootstrap-icon";
import {useCurrentTime} from "../admin/sprints/use-current-time";

type Attendance="held"|"not_held"|"cancelled";
const attendanceKind={ceremony:"standard",template:"custom",exceptional:"exceptional"} as const;

export default function CalendarMeetingModal({meeting,isAdmin,onClose,onSaved}:{
 meeting:CalendarMeeting;isAdmin:boolean;onClose:()=>void;onSaved:()=>void;
}){
 const t=useTranslation(),now=useCurrentTime();
 const [detail,setDetail]=useState<CalendarMeetingDetail|null>(null);
 const [loadState,setLoadState]=useState<"loading"|"ready"|"error">("loading");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [start,setStart]=useState(""),[end,setEnd]=useState("");
 const [scope,setScope]=useState<"single"|"following">("single");
 const [actual,setActual]=useState(0);
 const [newStatus,setNewStatus]=useState<Attendance|"">("");
 const [reason,setReason]=useState("");
 const [outcomes,setOutcomes]=useState<MeetingOutcome[]>([]);
 const [outcomesState,setOutcomesState]=useState<"loading"|"ready"|"error">("loading");
 const [outcomeType,setOutcomeType]=useState<MeetingOutcomeType>("decision");
 const [outcomeText,setOutcomeText]=useState("");
 const closeRef=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 const api="/api/team-calendar/meetings/"+encodeURIComponent(meeting.kind)+"/"+encodeURIComponent(meeting.id);
 const outcomeApi=api+"/outcomes";
 function apply(item:CalendarMeetingDetail){
  setDetail(item);
  setStart(formatCalendarLocalTime(item.startAt,item.timeZone));
  setEnd(formatCalendarLocalTime(item.endAt,item.timeZone));
  setActual(item.actualMinutes??item.plannedMinutes);
  setScope("single");setNewStatus("");setReason("");
 }
 useEffect(()=>{
  let active=true;
  const controller=new AbortController();
  void fetch(api,{cache:"no-store",signal:controller.signal}).then(async res=>{
   if(!res.ok)throw Error("detail");
   return res.json() as Promise<{meeting:CalendarMeetingDetail}>;
  }).then(result=>{
   if(!active)return;
   if(!result.meeting||result.meeting.id!==meeting.id||result.meeting.kind!==meeting.kind)throw Error("detail");
   apply(result.meeting);setLoadState("ready");
  }).catch(()=>{if(active)setLoadState("error");});
  return()=>{active=false;controller.abort();};
 },[api,meeting.id,meeting.kind]);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch(outcomeApi,{cache:"no-store",signal:controller.signal}).then(async res=>{
   if(!res.ok)throw Error("outcomes");
   return res.json() as Promise<{outcomes:MeetingOutcome[]}>;
  }).then(result=>{
   if(!controller.signal.aborted){setOutcomes(result.outcomes);setOutcomesState("ready");}
  }).catch(()=>{if(!controller.signal.aborted)setOutcomesState("error");});
  return()=>controller.abort();
 },[outcomeApi]);
 const canEdit=!busy&&isAdmin&&detail!==null&&detail.sprintStatus!=="closed";
 const canSchedule=canEdit&&detail?.revision!==null&&detail?.status!=="cancelled";
 const initialStart=detail?formatCalendarLocalTime(detail.startAt,detail.timeZone):"";
 const initialEnd=detail?formatCalendarLocalTime(detail.endAt,detail.timeZone):"";
 const scheduleDirty=!!canSchedule&&(start!==initialStart||end!==initialEnd);
 const actualDirty=!!canEdit&&actual!==(detail?.actualMinutes??detail?.plannedMinutes);
 const draftMinutes=detail?durationBetweenLocal(start,end,detail.timeZone):null;
 const maxDuration=detail?.kind==="ceremony"?600:480;
 const validSchedule=draftMinutes!==null&&draftMinutes<=maxDuration;
 const hasChanges=scheduleDirty||actualDirty||newStatus!==""||reason.trim()!==""||outcomeText.trim()!=="";
 function close(){
  if(busy)return;
  if(hasChanges&&!window.confirm(t("calendarMeeting.discard")))return;
  onClose();
 }
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  closeRef.current?.focus();
  return()=>previous?.focus();
 },[]);
 useEffect(()=>{
  const handle=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();close();return;}
   if(event.key!=="Tab"||!dialogRef.current)return;
   const controls=Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
    'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]'
   )).filter(el=>el.getClientRects().length>0);
   if(!controls.length)return;
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener("keydown",handle);
  return()=>document.removeEventListener("keydown",handle);
 });
 const statusLabel=(status:string)=>{
  if(status==="scheduled"||status==="planned")return t("sprintDetail.ceremonyStatus.scheduled");
  if(status==="held")return t("sprintDetail.ceremonyStatus.held");
  if(status==="not_held")return t("sprintDetail.ceremonyStatus.notHeld");
  if(status==="cancelled")return t("sprintDetail.ceremonyStatus.cancelled");
  return t("sprintDetail.ceremonyStatus.unknown");
 };
 const categoryLabel=(kind:string)=>{
  if(kind==="ceremony")return t("calendarMeeting.ceremony");
  if(kind==="template")return t("calendarMeeting.template");
  return t("calendarMeeting.exceptional");
 };
 async function refresh(){
  const res=await fetch(api,{cache:"no-store"});
  if(!res.ok)throw Error("refresh");
  const result=await res.json() as {meeting:CalendarMeetingDetail};
  if(!result.meeting||result.meeting.id!==meeting.id)throw Error("refresh");
  apply(result.meeting);
  onSaved();
 }
 async function patch(url:string,body:unknown){
  if(busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await fetch(url,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const data=await result.json() as {ok?:boolean;error?:string;warningCount?:number};
   if(!result.ok||data.ok===false)throw Error(data.error??"save");
   await refresh();
   setNotice(t("calendarMeeting.saved")+(data.warningCount?" "+t("calendarMeeting.warning"):""));
  }catch(err){
   const code=err instanceof Error?err.message:"save";
   setError(t(code==="conflict"?"calendarMeeting.conflict":code==="outside-sprint"?"calendarMeeting.outsideSprint":code==="closed-period"?"calendarMeeting.closedPeriod":code==="not-yet-due"?"calendarMeeting.notYetDue":"calendarMeeting.saveError"));
  }finally{setBusy(false);}
 }
 const saveSchedule=()=>{
  if(!canSchedule||!detail||!scheduleDirty)return;
  const iso=resolveCalendarLocalTime(start,detail.timeZone);
  const isoEnd=resolveCalendarLocalTime(end,detail.timeZone);
  if(!iso||!isoEnd||!validSchedule){setError(t("calendarMeeting.invalidSchedule"));return;}
  if(detail.kind==="ceremony"&&detail.ceremonyKind==="daily"&&scope==="following"){
   void patch("/api/admin/sprints/ceremonies/"+encodeURIComponent(detail.id),{
    startAt:iso,minutes:draftMinutes,scope,revision:detail.revision
   });return;
  }
  void patch(api,{startAt:iso,endAt:isoEnd,revision:detail.revision});
 };
 const saveActual=()=>{
  if(!canEdit||!detail||!Number.isSafeInteger(actual)||actual<0||actual>1440)return;
  void patch("/api/admin/sprints/actual-duration",{
   id:detail.id,kind:attendanceKind[detail.kind],minutes:actual
  });
 };
 const saveStatus=()=>{
  if(!canEdit||!detail||!newStatus)return;
  if(newStatus!=="cancelled"&&(now===null||Date.parse(detail.endAt)>now)){
   setError(t("calendarMeeting.notYetDue"));return;
  }
  void patch("/api/admin/sprints/attendance",{
   id:detail.id,kind:attendanceKind[detail.kind],status:newStatus,reason
  });
 };
 async function saveOutcome(){
  if(!canEdit||!detail||!outcomeText.trim()||busy)return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch(outcomeApi,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({type:outcomeType,text:outcomeText.trim()})});
   const data=await response.json() as {ok?:boolean;error?:string};
   if(!response.ok||!data.ok){
    if(data.error==="closed-period"){setError(t("calendarMeeting.closedPeriod"));return;}
    throw Error("outcome");
   }
   setOutcomeText("");
   setNotice(t("calendarMeeting.outcomeSaved"));
   onSaved();
   try{
    const list=await fetch(outcomeApi,{cache:"no-store"});
    if(!list.ok)throw Error("refresh");
    const result=await list.json() as {outcomes:MeetingOutcome[]};
    setOutcomes(result.outcomes);setOutcomesState("ready");
   }catch{setOutcomesState("error");}
  }catch{setError(t("calendarMeeting.outcomeSaveError"));}
  finally{setBusy(false);}
 }
 const saveButton=(name:string,action:()=>void,disabled:boolean)=>
  <button type="button" className="btn btn-outline-primary btn-sm smn-cal-save-icon"
   disabled={busy||disabled} aria-label={name} title={name} onClick={action}>
   <BootstrapIcon name="floppy"/>
  </button>;
 const outcomeLabel=(type:MeetingOutcomeType)=>t(type==="decision"?
  "calendarMeeting.outcomeDecision":type==="action"?
  "calendarMeeting.outcomeAction":"calendarMeeting.outcomeHighlight");
 return <div className="smn-member-modal-backdrop smn-cal-detail-backdrop" role="presentation">
  <div ref={dialogRef} className="smn-member-modal smn-cal-detail-modal smn-cal-detail-compact smn-cockpit-modal" role="dialog" aria-modal="true"
   aria-labelledby="calendar-meeting-dialog-title" aria-describedby="calendar-meeting-dialog-description">
   <header className="d-flex justify-content-between align-items-start gap-3 mb-2 smn-cockpit-modal-header">
    <div><div className="smn-cal-eyebrow">{t("calendarMeeting.heading")}</div>
     <h2 id="calendar-meeting-dialog-title" className="h5 mb-1">{detail?.name??meeting.name}</h2>
     <p id="calendar-meeting-dialog-description" className="small text-secondary mb-0">{t("calendarMeeting.intro")}</p></div>
    <button ref={closeRef} type="button" className="btn btn-outline-secondary btn-sm"
     aria-label={t("calendarOptionB.close")} onClick={close} disabled={busy}>×</button>
   </header>
   {loadState==="loading"&&<p role="status">{t("teamCalendar.loading")}</p>}
   {loadState==="error"&&<p role="alert" className="alert alert-warning">{t("calendarMeeting.loadError")}</p>}
   {detail&&loadState==="ready"&&<>
    <div className="smn-cal-identity-grid">
     <label className="form-label">{t("calendarUX.meetingName")}
      <input className="form-control" value={detail.name} readOnly/></label>
     <label className="form-label">{t("calendarMeeting.type")}
      <input className="form-control" value={categoryLabel(detail.kind)} readOnly/></label>
     <label className="form-label">{t("calendarMeeting.sprint")}
      <input className="form-control" value={detail.sprintName} readOnly/></label>
     <label className="form-label">{t("calendarMeeting.zone")}
      <input className="form-control" value={detail.timeZone} readOnly/></label>
    </div>
    <section className="smn-cal-detail-section mt-2" aria-labelledby="calendar-meeting-schedule">
     <h3 id="calendar-meeting-schedule" className="h6 mb-2">{t("calendarMeeting.schedule")}</h3>
     <div className="smn-cal-inline-fields">
      <label className="form-label">{t("calendarUX.meetingStart")}
       <input type="datetime-local" className="form-control" value={start}
        onChange={e=>setStart(e.target.value)} readOnly={!canSchedule}/></label>
      <label className="form-label">{t("calendarUX.meetingEnd")}
       <input type="datetime-local" className="form-control" value={end}
        onChange={e=>setEnd(e.target.value)} readOnly={!canSchedule}/></label>
      <label className="form-label">{t("calendarMeeting.plannedMinutes")}
       <input type="number" className="form-control" min={1} max={maxDuration}
        value={draftMinutes??""} readOnly aria-describedby="calendar-meeting-duration-hint"/></label>
      {canSchedule&&detail.kind==="ceremony"&&detail.status==="scheduled"&&detail.ceremonyKind==="daily"&&<label className="form-label">
       {t("calendarMeeting.scope")}
       <select className="form-select" value={scope} onChange={e=>setScope(e.target.value as "single"|"following")}>
        <option value="single">{t("ceremonyEdit.single")}</option>
        <option value="following">{t("ceremonyEdit.following")}</option>
       </select>
      </label>}
      {canSchedule&&saveButton(t("calendarMeeting.saveSchedule"),saveSchedule,
       !scheduleDirty||!validSchedule)}
     </div>
     <p id="calendar-meeting-duration-hint" className="small text-secondary mt-1 mb-0">
      {t("calendarMeeting.durationCalculated")}</p>
     {!canSchedule&&<p className="small text-secondary mt-1 mb-0">{t("calendarMeeting.scheduleReadonly")}</p>}
     {canSchedule&&!validSchedule&&<p role="alert" className="small text-danger mt-1">{t("calendarMeeting.invalidSchedule")}</p>}
    </section>
    <section className="smn-cal-detail-section mt-2" aria-labelledby="calendar-meeting-attendance">
     <h3 id="calendar-meeting-attendance" className="h6 mb-2">{t("calendarMeeting.attendance")}</h3>
     <div className="smn-cal-inline-fields">
      <label className="form-label">{t("calendarUX.meetingStatus")}
       <input className="form-control" value={statusLabel(detail.status)+(
        detail.status==="held"&&detail.statusExplicit===false?" ("+t("sprintDetail.ceremonyInferred")+")":"")} readOnly/></label>
      <label className="form-label">{t("calendarMeeting.actualMinutes")}
       <input type="number" className="form-control" value={actual} min={0} max={1440}
        onChange={e=>setActual(Number(e.target.value))} readOnly={!canEdit}/></label>
      {canEdit&&saveButton(t("calendarMeeting.saveActual"),saveActual,
       !actualDirty||!Number.isSafeInteger(actual)||actual<0||actual>1440)}
     </div>
     {canEdit&&<div className="smn-cal-inline-fields mt-2">
      <label className="form-label">{t("calendarMeeting.changeStatus")}
       <select className="form-select" value={newStatus} onChange={e=>setNewStatus(e.target.value as Attendance|"")}>
        <option value="">{t("calendarMeeting.chooseStatus")}</option>
        <option value="held">{t("attendance.held")}</option>
        <option value="not_held">{t("attendance.not_held")}</option>
        <option value="cancelled">{t("attendance.cancelled")}</option>
       </select></label>
      <label className="form-label">{t("attendance.reason")}
       <input className="form-control" maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/></label>
      {saveButton(t("calendarMeeting.saveStatus"),saveStatus,!newStatus)}
     </div>}
     {!canEdit&&<p className="small text-secondary mt-1 mb-0">{t("calendarMeeting.readonly")}</p>}
    </section>
    <section className="smn-cal-detail-section mt-2" aria-labelledby="calendar-meeting-outcomes">
     <h3 id="calendar-meeting-outcomes" className="h6 mb-2">{t("calendarMeeting.outcomes")}</h3>
     {isAdmin&&detail.sprintStatus!=="closed"&&<div className="smn-cal-outcome-form">
      <label className="form-label">{t("calendarMeeting.outcomeType")}
       <select className="form-select" value={outcomeType} disabled={busy}
        onChange={e=>setOutcomeType(e.target.value as MeetingOutcomeType)}>
        <option value="decision">{outcomeLabel("decision")}</option>
        <option value="action">{outcomeLabel("action")}</option>
        <option value="highlight">{outcomeLabel("highlight")}</option>
       </select></label>
      <label className="form-label">{t("calendarMeeting.outcomeText")}
       <textarea className="form-control" rows={2} required maxLength={2000}
        placeholder={t("calendarMeeting.outcomePlaceholder")}
        value={outcomeText} disabled={busy}
        onChange={e=>setOutcomeText(e.target.value)}/></label>
      {saveButton(t("calendarMeeting.outcomeSave"),()=>void saveOutcome(),
       !outcomeText.trim())}
     </div>}
     {outcomesState==="loading"&&<p className="small text-secondary mt-2 mb-0" role="status">{t("calendarMeeting.outcomesLoading")}</p>}
     {outcomesState==="error"&&<p className="small text-secondary mt-2 mb-0" role="alert">{t("calendarMeeting.outcomesLoadError")}</p>}
     {outcomesState==="ready"&&outcomes.length===0&&<p className="small text-secondary mt-2 mb-0">{t("calendarMeeting.outcomesEmpty")}</p>}
     {outcomesState==="ready"&&outcomes.length>0&&<ul className="list-unstyled smn-cal-outcome-list mt-2 mb-0">
      {outcomes.map(item=><li key={item.id} className="smn-cal-outcome-item">
       <span className="badge text-bg-secondary">{outcomeLabel(item.type)}</span>
       <Link href={"/app/admin/registries/"+encodeURIComponent(item.id)} className="text-break">
        {item.title}</Link>
      </li>)}
     </ul>}
    </section>
    {detail.generationSource==="reconstructed"&&<p className="small text-secondary mt-2">
     {t("sprintWizard.reconstructedLabel")}</p>}
   </>}
   {notice&&<p role="status" className="alert alert-success py-2 mt-2">{notice}</p>}
   {error&&<p role="alert" className="alert alert-warning py-2 mt-2">{error}</p>}
   <footer className="d-flex justify-content-end mt-2 smn-cockpit-modal-footer">
    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={close} disabled={busy}>
     {t("calendarOptionB.close")}</button>
   </footer>
  </div>
 </div>;
}
