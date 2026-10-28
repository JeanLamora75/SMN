"use client";
import {useState} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import BootstrapIcon from "../bootstrap-icon";

export type CalendarEntry={id:string;date:string;type:"absence"|"closure"|"holiday"|"cycle"|"meeting";title:string;sourceHref:string|null;aggregateCount?:number;companyId?:string;companyName?:string;companyColor?:string;members?:{id:string;name:string}[]};
export type CalendarMeeting={id:string;name:string;startAt:string;endAt:string;kind:string;href:string;generationSource?:string;status?:string};
export type CalendarMode="cards"|"agenda";

const dateAtNoon=(day:string)=>new Date(day+"T12:00:00Z");
const calendarDay=(instant:string,timeZone:string)=>new Intl.DateTimeFormat("sv-SE",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(instant));
type IconName="calendar3"|"calendar-event"|"calendar-check"|"bullseye"|"chat-dots"|"sliders";
function meetingIcon(meeting:CalendarMeeting):IconName{
 const label=meeting.name.toLocaleLowerCase();
 if(/planning|planification/.test(label))return "calendar-event";
 if(/daily|mêlée quotidienne|quotidienne/.test(label))return "calendar-check";
 if(/review|revue/.test(label))return "bullseye";
 if(/retro|rétro/.test(label))return "chat-dots";
 if(/refinement|affinage/.test(label))return "sliders";
 return "calendar3";
}

export default function CalendarOptionB({days,entries,meetings,absenceCounts,absentNames,today,
 mode,showMeetings,showAbsences,timeZone="Europe/Paris",isEditable,onMeeting,onAbsence,onOpenEvent,onClosure}:{
 days:string[];entries:CalendarEntry[];meetings:CalendarMeeting[];
 absenceCounts:Record<string,number>;absentNames:Record<string,string[]>;today:string;mode:CalendarMode;
 showMeetings:boolean;showAbsences:boolean;timeZone?:string;isEditable:(date:string)=>boolean;
 onMeeting:(date:string)=>void;onAbsence:(date:string)=>void;
 onOpenEvent:(event:CalendarMeeting)=>void;onClosure:(event:CalendarEntry)=>void;
}){
 const t=useTranslation(),locale=useLocale();
 const [openedAbsenceDate,setOpenedAbsenceDate]=useState<string|null>(null);
 const dateLabel=(day:string,options:Intl.DateTimeFormatOptions)=>
  new Intl.DateTimeFormat(locale,{timeZone:"UTC",...options}).format(dateAtNoon(day));
 const clock=(raw:string)=>new Intl.DateTimeFormat(locale,{timeZone,hour:"2-digit",minute:"2-digit"}).format(new Date(raw));
 const meetingTitle=(m:CalendarMeeting)=>{
  if(m.kind!=="ceremony")return m.name;
  const kind=m.name.split(" — ").at(-1)?.toLocaleLowerCase()??"";
  if(kind.includes("planning"))return t("calendarOptionB.planning");
  if(kind.includes("daily"))return t("calendarOptionB.daily");
  if(kind.includes("review"))return t("calendarOptionB.review");
  if(kind.includes("retro")||kind.includes("rétro"))return t("calendarOptionB.retro");
  if(kind.includes("refinement")||kind.includes("affinage"))return t("calendarOptionB.refinement");
  return m.name;
 };
 const renderEvents=(date:string)=>{
  const count=absenceCounts[date];
  const dayMeetings=showMeetings?meetings.filter(m=>calendarDay(m.startAt,timeZone)===date)
   .sort((a,b)=>new Date(a.startAt).getTime()-new Date(b.startAt).getTime()||a.id.localeCompare(b.id)):[];
  const closures=entries.filter(item=>item.date===date&&item.type==="closure");
  return <>
   {showAbsences&&count>0&&(()=>{
    const names=absentNames[date]??[];
    const label=t("calendarOptionB.absences",{count});
    const contents=<>
     <span className="smn-cal-icon"><BootstrapIcon name="people-fill"/></span>
     <span className="smn-cal-event-title smn-cal-absence-title">{label}</span>
    </>;
    if(!names.length)return <div className="smn-cal-event smn-cal-absence" role="note" aria-label={label}>
     {contents}
    </div>;
    const expanded=openedAbsenceDate===date;
    const tooltipId="smn-cal-absence-tooltip-"+date;
    return <div className={"smn-cal-absence-wrap"+(expanded?" is-expanded":"")}>
     <button type="button" className="smn-cal-event smn-cal-absence smn-cal-absence-trigger"
      aria-label={label} aria-describedby={tooltipId} aria-expanded={expanded}
      onClick={()=>setOpenedAbsenceDate(expanded?null:date)}>
      {contents}
     </button>
     <div className="smn-cal-absence-tooltip" id={tooltipId} role="tooltip">
      <strong>{t("calendarOptionB.absentMembers")}</strong>
      <ul>{names.map((person,i)=><li key={i}>{person}</li>)}</ul>
     </div>
    </div>;
   })()}
   {dayMeetings.map(m=><div key={m.kind+":"+m.id} className="smn-cal-event">
     <span className="smn-cal-icon"><BootstrapIcon name={meetingIcon(m)}/></span>
     <div className="smn-cal-event-copy">
      <button type="button" className="smn-cal-event-title smn-cal-event-open"
       aria-haspopup="dialog" onClick={()=>onOpenEvent(m)} title={clock(m.startAt)+" – "+clock(m.endAt)}>
       {meetingTitle(m)}</button>
      <span className="smn-cal-event-time">{clock(m.startAt)} – {clock(m.endAt)}</span>
      {m.generationSource==="reconstructed"&&<span className="smn-cal-event-time">{t("sprintWizard.reconstructedLabel")}</span>}
     </div>
    </div>)}
   {closures.map(item=><div key={item.id} className="smn-cal-event smn-cal-closure" style={{borderLeft:item.companyColor?`4px solid var(--bs-${item.companyColor}, var(--bs-secondary))`:undefined}}>
    <span className="smn-cal-icon"><BootstrapIcon name="calendar3"/></span>
    <button type="button" className="smn-cal-event-title smn-cal-event-open" aria-haspopup="dialog" onClick={()=>onClosure(item)}>{item.companyName?item.companyName+" · ":""}{item.title}</button>
   </div>)}
  </>;
 };
 const renderActions=(date:string)=>isEditable(date)?<div className="smn-cal-day-actions">
    <button type="button" onClick={()=>onMeeting(date)}>{t("calendarOptionB.addMeeting")}</button>
    <button type="button" onClick={()=>onAbsence(date)}>{t("calendarOptionB.addAbsence")}</button>
   </div>:null;
 if(mode==="agenda")return <div className="smn-cal-agenda" aria-label={t("calendarOptionB.agenda")}>
  {days.map(date=>{
   const d=dateAtNoon(date),weekend=[0,6].includes(d.getUTCDay());
   const holiday=entries.find(e=>e.date===date&&e.type==="holiday");
   const count=absenceCounts[date]??0;
   const hasMeetings=showMeetings&&meetings.some(m=>calendarDay(m.startAt,timeZone)===date);
   const hasClosure=entries.some(e=>e.date===date&&e.type==="closure");
   return <section className={"smn-cal-agenda-day"+(date===today?" is-today":"")} key={date}>
    <div className="smn-cal-agenda-date">
      <strong>{dateLabel(date,{weekday:"long",day:"numeric",month:"short"})}</strong>
      {holiday&&<span className="smn-calendar-holiday">{holiday.title||t("calendarOptionB.holiday")}</span>}
      {weekend&&<span className="smn-cal-muted">{t("calendarOptionB.nonworking")}</span>}
    </div>
    <div className="smn-cal-agenda-content">
      <div className="smn-cal-agenda-events">
       {renderEvents(date)}
       {(!showAbsences||count===0)&&!hasMeetings&&!hasClosure&&<span className="smn-cal-muted">{t("calendarOptionB.noEvents")}</span>}
      </div>
      {renderActions(date)}
    </div>
   </section>;
  })}
 </div>;
 return <div className="smn-calendar-grid" aria-label={t("calendarOptionB.cards")}>
  {days.map(date=>{
   const d=dateAtNoon(date),weekend=[0,6].includes(d.getUTCDay());
   const holiday=entries.find(e=>e.date===date&&e.type==="holiday");
   return <article key={date} className={"smn-calendar-day smn-cal-card"+(weekend||holiday?" is-nonwork":"")+(date===today?" is-today":"")}>
     <header className="smn-cal-card-header">
      <span className="smn-cal-weekday">{dateLabel(date,{weekday:"short"})}</span>
      <div className="smn-cal-date">
       <strong>{dateLabel(date,{day:"numeric"})}</strong>
       <span>{dateLabel(date,{month:"short"})}</span>
      </div>
      {date===today&&<span className="smn-cal-today">{t("calendarOptionB.today")}</span>}
      {holiday&&<div className="smn-calendar-holiday">{holiday.title||t("calendarOptionB.holiday")}</div>}
     </header>
     <div className="smn-cal-events">{renderEvents(date)}</div>
     {renderActions(date)}
   </article>;
  })}
 </div>;
}
