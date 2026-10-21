"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useTranslation} from "@/i18n/client";
import MemberAbsenceEditor from "../admin/members/member-absence-editor";

type Slot={morning:boolean;afternoon:boolean};
type Absence={
 id:string;revision:number;categoryId:string;categoryName:string;categoryColor:string;
 startOn:string;endOn:string;startSlot:"morning"|"afternoon";endSlot:"morning"|"afternoon";
 isPlanned:boolean;reason:string;
};
type MemberDay={
 date:string;workingSlots:Slot|null;availableSlots:Slot|null;deductedHalfDays:number|null;
 status:"known"|"unknown";nationalHolidayName:string|null;
 companyClosureName:string|null;absences:Absence[];
};
type Member={id:string;displayName:string;memberNumber:number;days:MemberDay[]};
type Summary={date:string;assigned:number;reportedUnavailable:number;
 known:number;unknown:number;availableMembers:number};
type CentralType="absence"|"closure"|"holiday"|"cycle"|"meeting";
type CentralItem={
 id:string;date:string;type:CentralType;title:string;memberId?:string;memberName?:string;
 sourceHref:string|null;categoryColor?:string;categoryName?:string;aggregateCount?:number;
 planned?:boolean;startOn?:string;endOn?:string;
 utcInstant?:string;ianaZone?:string;localTime?:string;
 meetingStatus?:"scheduled"|"held"|"cancelled"|"unknown";
};
type Calendar={
 team:{id:string;name:string;mode:string};start:string;end:string;days:7|14|28;
 central:{items:CentralItem[];types:CentralType[];cyclesAvailable:boolean;meetingsAvailable:boolean};
 collective:Summary[];
 closures:{id:string;name:string;startOn:string;endOn:string}[];admin?:{members:Member[];categories:{id:string;name:string}[]};
};
function todayLocal(){
 const date=new Date();
 const p=(n:number)=>String(n).padStart(2,"0");
 return date.getFullYear()+"-"+p(date.getMonth()+1)+"-"+p(date.getDate());
}
function shift(date:string,diff:number){
 const day=new Date(date+"T00:00:00.000Z");
 day.setUTCDate(day.getUTCDate()+diff);
 return day.toISOString().slice(0,10);
}
function weekStart(date:string){
 const dt=new Date(date+"T00:00:00.000Z");
 const dow=dt.getUTCDay()||7;
 return shift(date,1-dow);
}

export default function TeamCalendarView({isAdmin}:{isAdmin:boolean}){
 const t=useTranslation();
 const [start,setStart]=useState(()=>weekStart(todayLocal()));
 const [days,setDays]=useState<7|14|28>(7);
 const [kind,setKind]=useState<"all"|"planned"|"unplanned">("all");
 const [centralType,setCentralType]=useState<CentralType|"all">("all");
 const [categoryId,setCategoryId]=useState("");
 const [memberId,setMemberId]=useState("");
 const [state,setState]=useState<Calendar|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [selection,setSelection]=useState<{memberId:string;date:string}|null>(null);
 const [editorDirty,setEditorDirty]=useState(false);
 const [revision,setRevision]=useState(0);
 const title=t("teamCalendar.title");
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError(false);
  const query=new URLSearchParams({start,days:String(days)});
  if(isAdmin){
   if(kind!=="all")query.set("kind",kind);
   if(categoryId)query.set("categoryId",categoryId);
   if(memberId)query.set("memberId",memberId);
  }
  void fetch("/api/team-calendar?"+query.toString(),{
   cache:"no-store",signal:controller.signal
  }).then(async response=>{
   if(!response.ok)throw Error("team-calendar-fetch-failed");
   return response.json() as Promise<Calendar>;
  }).then(data=>{
   if(controller.signal.aborted)return;
   if(!Array.isArray(data.collective)||data.collective.length!==days||
      !Array.isArray(data.central?.items)||Boolean(data.admin)!==isAdmin)throw Error("team-calendar-malformed-response");
   setState(data);setLoading(false);
  }).catch(()=>{
   if(controller.signal.aborted)return;
   setError(true);setLoading(false);setState(null);
  });
  return ()=>controller.abort();
 },[start,days,kind,categoryId,memberId,isAdmin,revision]);
 const displayed=useMemo(()=>{
  const names=new Map<string,string>();
  for(const member of state?.admin?.members??[])names.set(member.id,member.displayName);
  return names;
 },[state]);
 const categories=state?.admin?.categories??[];
 const visibleEntries=(state?.central?.items??[]).filter(item=>
  centralType==="all"||item.type===centralType);
 const centralTypes=[
  "absence","closure","holiday","cycle","meeting"
 ] as const;
 const selectedMember=state?.admin?.members.find(m=>m.id===selection?.memberId);
 const maySwitchEditor=()=>!editorDirty||window.confirm(t("draft.discardWarning"));
 const changeStart=(newStart:string)=>{
  if(!maySwitchEditor())return;
  setStart(newStart);setSelection(null);setEditorDirty(false);
 };
 const choose=(id:string,date:string)=>{
  if(!isAdmin||!maySwitchEditor())return;
  setEditorDirty(false);
  setSelection(s=>s?.memberId===id&&s.date===date?null:{memberId:id,date});
 };
 return <section className="smn-page container py-4 d-grid gap-3">
  <header>
   <h1 className="h3">{title}</h1>
   <p className="text-secondary">{t(isAdmin?
    "teamCalendar.adminIntro":"teamCalendar.userIntro")}</p>
   {isAdmin&&<Link href="/app/admin/company-closures" className="btn btn-outline-primary">
    {t("companyClosures.manage")}</Link>}
   {isAdmin&&<Link href="/app/admin/development-capacity" className="btn btn-outline-primary ms-2">
    {t("developmentCapacity.open")}</Link>}
  </header>
  <div className="smn-panel p-3 d-grid gap-3">
   <div className="row g-3 align-items-end">
    <div className="col-md-4">
     <label htmlFor="team-calendar-start" className="form-label">{t("teamCalendar.start")}</label>
     <input id="team-calendar-start" type="date" className="form-control"
      min="1900-01-01" max="2200-12-01" value={start}
      onChange={e=>{if(e.target.value)changeStart(e.target.value);}}/>
    </div>
    <div className="col-md-3">
     <label htmlFor="team-calendar-days" className="form-label">{t("teamCalendar.period")}</label>
     <select id="team-calendar-days" className="form-select" value={days}
      onChange={e=>{if(!maySwitchEditor())return;setDays(Number(e.target.value) as 7|14|28);setSelection(null);setEditorDirty(false);}}>
      <option value={7}>{t("teamCalendar.sevenDays")}</option>
      <option value={14}>{t("teamCalendar.fourteenDays")}</option>
      <option value={28}>{t("teamCalendar.twentyEightDays")}</option>
     </select>
    </div>
    <div className="col-md-5 d-flex gap-2 flex-wrap">
     <button type="button" className="btn btn-outline-secondary"
      onClick={()=>changeStart(weekStart(todayLocal()))}>{t("teamCalendar.today")}</button>
     <button type="button" className="btn btn-outline-secondary"
      disabled={start<="1900-01-07"}
      onClick={()=>changeStart(shift(start,-days))}>{t("teamCalendar.previous")}</button>
     <button type="button" className="btn btn-outline-secondary"
      disabled={start>="2200-11-01"}
      onClick={()=>changeStart(shift(start,days))}>{t("teamCalendar.next")}</button>
    </div>
   </div>
   <div className="row g-3">
    <div className="col-md-6">
     <label className="form-label" htmlFor="team-calendar-team">
      {t("centralCalendar.teamFilter")}</label>
     <select id="team-calendar-team" className="form-select" value={state?.team.id??""}
      disabled aria-describedby="team-calendar-single-team">
      {state?<option value={state.team.id}>{state.team.name}</option>:
       <option value="">{t("centralCalendar.noTeam")}</option>}
     </select>
     <p id="team-calendar-single-team" className="small text-secondary mb-0">
      {t("centralCalendar.singleTeam")}</p>
    </div>
    <div className="col-md-6">
     <label className="form-label" htmlFor="central-calendar-type">
      {t("centralCalendar.typeFilter")}</label>
     <select id="central-calendar-type" className="form-select" value={centralType}
      onChange={e=>setCentralType(e.target.value as CentralType|"all")}>
      <option value="all">{t("centralCalendar.allTypes")}</option>
      {centralTypes.map(type=><option key={type} value={type}>
       {t(("centralCalendar."+type) as "centralCalendar.absence")}</option>)}
     </select>
    </div>
   </div>
   {isAdmin&&<div className="row g-3">
    <div className="col-md-4">
     <label htmlFor="team-calendar-member" className="form-label">{t("teamCalendar.memberFilter")}</label>
     <select id="team-calendar-member" className="form-select" value={memberId}
      onChange={e=>{if(!maySwitchEditor())return;setMemberId(e.target.value);setSelection(null);setEditorDirty(false);}}>
      <option value="">{t("teamCalendar.allMembers")}</option>
      {(state?.admin?.members??[]).map(m=><option key={m.id} value={m.id}>{m.displayName}</option>)}
      {memberId&&!displayed.has(memberId)&&
       <option value={memberId}>{t("teamCalendar.memberSelected")}</option>}
     </select>
    </div>
    <div className="col-md-4">
     <label htmlFor="team-calendar-kind" className="form-label">{t("teamCalendar.typeFilter")}</label>
     <select id="team-calendar-kind" className="form-select" value={kind}
      onChange={e=>setKind(e.target.value as "all"|"planned"|"unplanned")}>
      <option value="all">{t("teamCalendar.allTypes")}</option>
      <option value="planned">{t("teamCalendar.planned")}</option>
      <option value="unplanned">{t("teamCalendar.unplanned")}</option>
     </select>
    </div>
    <div className="col-md-4">
     <label htmlFor="team-calendar-category" className="form-label">
      {t("teamCalendar.categoryFilter")}</label>
     <select id="team-calendar-category" className="form-select" value={categoryId}
      onChange={e=>setCategoryId(e.target.value)}>
      <option value="">{t("teamCalendar.allCategories")}</option>
      {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
     </select>
    </div>
   </div>}
   <p className="small text-secondary mb-0">{t("teamCalendar.filtersHint")}</p>
  </div>
  {loading&&<p role="status">{t("teamCalendar.loading")}</p>}
  {error&&<div className="alert alert-warning" role="alert">
   {t("teamCalendar.loadFailed")}
   <button className="btn btn-sm btn-outline-secondary ms-2" type="button"
    onClick={()=>setRevision(n=>n+1)}>{t("common.retry")}</button>
  </div>}
  {!loading&&state&&<>
   <h2 className="h5">{t("teamCalendar.teamLabel",{team:state.team.name})}</h2>
   <p className="small text-secondary">{t("teamCalendar.datesLabel",{
    start:state.start,end:state.end})}</p>
   <section className="smn-panel p-3 d-grid gap-3" aria-labelledby="central-calendar-heading">
    <h3 className="h5" id="central-calendar-heading">{t("centralCalendar.title")}</h3>
    <p className="small text-secondary mb-0">{t("centralCalendar.readOnly")}</p>
    <div className="d-flex flex-wrap gap-3 small" aria-label={t("centralCalendar.legend")}>
     {centralTypes.map(type=><span key={type}>
      <span aria-hidden="true">● </span>
      {t(("centralCalendar."+type) as "centralCalendar.absence")}</span>)}
    </div>
    {!state.central.cyclesAvailable&&
     <p className="small text-secondary mb-0">{t("centralCalendar.noCycles")}</p>}
    {!state.central.meetingsAvailable&&
     <p className="small text-secondary mb-0">{t("centralCalendar.noMeetings")}</p>}
    {visibleEntries.length===0?<p>{t("centralCalendar.noItems")}</p>:
     <ol className="list-unstyled d-grid gap-3 mb-0">
      {state.collective.map(day=>{
       const entries=visibleEntries.filter(item=>item.date===day.date);
       return entries.length===0?null:<li key={day.date} className="border rounded p-2">
        <h4 className="h6">{day.date}</h4>
        <ul className="list-unstyled d-grid gap-2 mb-0">
         {entries.map(entry=><li key={entry.type+":"+entry.id+":"+entry.date}
          className="d-flex flex-wrap align-items-start gap-2">
          <span className="small fw-semibold">
           {t(("centralCalendar."+entry.type) as "centralCalendar.absence")}</span>
          {entry.categoryColor&&<span aria-hidden="true" className="rounded"
           style={{width:"0.85rem",height:"0.85rem",
            backgroundColor:entry.categoryColor,display:"inline-block"}}/>}
          <span>
           {entry.aggregateCount!==undefined?
            t("centralCalendar.aggregate",{count:entry.aggregateCount}):
            entry.memberName?
             entry.memberName+" — "+entry.title:entry.title}
           {entry.planned!==undefined&&
            <span className="small text-secondary ms-2">
             ({t(entry.planned?"teamCalendar.planned":"teamCalendar.unplanned")})</span>}
           {entry.meetingStatus&&<span className="small text-secondary ms-2">
            ({t(("centralCalendar.status."+
             entry.meetingStatus) as "centralCalendar.status.unknown")})</span>}
           {entry.utcInstant&&entry.ianaZone&&
            <span className="small text-secondary d-block">
             {t("centralCalendar.utc")}: {entry.utcInstant} ·
             {" "}{entry.ianaZone} : {entry.localTime}</span>}
          </span>
          {entry.sourceHref&&
           (entry.sourceHref.startsWith("#")?
            <a className="small" href={entry.sourceHref}>
             {t("centralCalendar.source")}</a>:
            <Link className="small" href={entry.sourceHref}>
             {t("centralCalendar.source")}</Link>)}
          {isAdmin&&entry.memberId&&
           <button type="button" className="btn btn-sm btn-outline-primary"
            onClick={()=>choose(entry.memberId!,entry.date)}>
            {t("teamCalendar.manageAbsence")}</button>}
         </li>)}
        </ul>
       </li>;
      })}
     </ol>}
   </section>
   <div className="smn-panel p-3" id="team-calendar-collective">
    <h3 className="h6">{t("teamCalendar.collectiveHeading")}</h3>
    <div className="table-responsive">
     <table className="table table-bordered table-sm align-middle">
      <thead><tr><th scope="col">{t("teamCalendar.day")}</th>
       <th scope="col">{t("companyClosures.collective")}</th>
       <th scope="col">{t("teamCalendar.assigned")}</th>
       <th scope="col">{t("teamCalendar.reportedUnavailable")}</th>
       <th scope="col">{t("teamCalendar.available")}</th>
       <th scope="col">{t("teamCalendar.unknown")}</th>
      </tr></thead>
      <tbody>{state.collective.map(d=><tr key={d.date}>
       <th scope="row">{d.date}</th>
       <td>{state.closures.filter(c=>c.startOn<=d.date&&c.endOn>=d.date)
        .map(c=><div key={c.id}><strong>{t("companyClosures.shortLabel")}</strong> {c.name}</div>)}
        {!state.closures.some(c=>c.startOn<=d.date&&c.endOn>=d.date)&&"—"}</td>
       <td>{d.assigned}</td><td>{d.reportedUnavailable}</td>
       <td>{d.availableMembers}</td><td>{d.unknown}</td>
      </tr>)}</tbody>
     </table>
    </div>
    <p className="small text-secondary mb-0">{t("teamCalendar.collectiveHint")}</p>
   </div>
   {isAdmin&&state.admin&&<section className="smn-panel p-3 d-grid gap-3">
    <h3 className="h5">{t("teamCalendar.adminHeading")}</h3>
    <p className="small text-secondary">{t("teamCalendar.adminFilterHint")}</p>
    {state.admin.members.length===0?<p>{t("teamCalendar.noMembers")}</p>:
     <div className="table-responsive">
      <table className="table table-bordered table-sm align-middle">
       <thead><tr><th scope="col">{t("teamCalendar.member")}</th>
        {state.collective.map(d=><th scope="col" key={d.date}>{d.date}</th>)}
       </tr></thead>
       <tbody>{state.admin.members.map(member=><tr key={member.id}>
        <th scope="row">{member.displayName}</th>
        {state.collective.map(d=>{
         const day=member.days.find(x=>x.date===d.date);
         return <td key={d.date} style={{minWidth:"10rem",verticalAlign:"top"}}>
          {day?<>
           {day.companyClosureName&&<p className="small mb-1">
            <strong>{t("companyClosures.shortLabel")}</strong> {day.companyClosureName}</p>}
           {day.nationalHolidayName&&<p className="small mb-1">
            <strong>{t("teamCalendar.holiday")}</strong> {day.nationalHolidayName}</p>}
           {day.absences.map(absence=><div key={absence.id} className="small mb-2">
            <span aria-hidden="true" className="d-inline-block rounded me-1"
             style={{width:"0.8rem",height:"0.8rem",backgroundColor:absence.categoryColor}}/>
            <strong>{absence.categoryName}</strong>: {absence.reason}
            <span className="d-block text-secondary">{t(absence.isPlanned?
             "teamCalendar.planned":"teamCalendar.unplanned")}</span>
           </div>)}
           {day.status==="unknown"&&<p className="small text-secondary mb-1">
            {t("teamCalendar.unknownAvailability")}</p>}
           <button type="button" className="btn btn-sm btn-outline-primary"
            onClick={()=>choose(member.id,d.date)}>
            {t("teamCalendar.manageAbsence")}</button>
          </>:<span className="text-secondary">{t("teamCalendar.notAssigned")}</span>}
         </td>;
        })}
       </tr>)}</tbody>
      </table>
     </div>}
    <p className="small text-secondary mb-0">{t("teamCalendar.categoryHint")}</p>
   </section>}
  </>}
  {isAdmin&&selection&&selectedMember&&
   <section className="smn-panel p-3" aria-labelledby="team-calendar-edit-title">
    <h2 id="team-calendar-edit-title" className="h5">
     {t("teamCalendar.editHeading",{member:selectedMember.displayName,date:selection.date})}</h2>
    <p className="small text-secondary">{t("teamCalendar.centralHint")}</p>
    <button className="btn btn-outline-secondary btn-sm" type="button"
     onClick={()=>{if(!maySwitchEditor())return;setSelection(null);setEditorDirty(false);}}>{t("teamCalendar.close")}</button>
    <MemberAbsenceEditor key={selection.memberId+":"+selection.date}
     memberId={selection.memberId} selectedOn={selection.date}
     onDirtyChange={setEditorDirty}
     onSaved={()=>setRevision(n=>n+1)}/>
   </section>}
 </section>;
}
