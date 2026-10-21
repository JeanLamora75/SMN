"use client";

import {useEffect,useMemo,useState} from "react";
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
 status:"known"|"unknown";nationalHolidayName:string|null;absences:Absence[];
};
type Member={id:string;displayName:string;memberNumber:number;days:MemberDay[]};
type Summary={date:string;assigned:number;reportedUnavailable:number;
 known:number;unknown:number;availableMembers:number};
type Calendar={
 team:{id:string;name:string;mode:string};start:string;end:string;days:7|14|28;
 collective:Summary[];admin?:{members:Member[];categories:{id:string;name:string}[]};
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
 const [categoryId,setCategoryId]=useState("");
 const [memberId,setMemberId]=useState("");
 const [state,setState]=useState<Calendar|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [selection,setSelection]=useState<{memberId:string;date:string}|null>(null);
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
      Boolean(data.admin)!==isAdmin)throw Error("team-calendar-malformed-response");
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
 const selectedMember=state?.admin?.members.find(m=>m.id===selection?.memberId);
 const changeStart=(newStart:string)=>{
  setStart(newStart);setSelection(null);
 };
 const choose=(id:string,date:string)=>{
  if(!isAdmin)return;
  setSelection(s=>s?.memberId===id&&s.date===date?null:{memberId:id,date});
 };
 return <section className="smn-page container py-4 d-grid gap-3">
  <header>
   <h1 className="h3">{title}</h1>
   <p className="text-secondary">{t(isAdmin?
    "teamCalendar.adminIntro":"teamCalendar.userIntro")}</p>
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
      onChange={e=>{setDays(Number(e.target.value) as 7|14|28);setSelection(null);}}>
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
   {isAdmin&&<div className="row g-3">
    <div className="col-md-4">
     <label htmlFor="team-calendar-member" className="form-label">{t("teamCalendar.memberFilter")}</label>
     <select id="team-calendar-member" className="form-select" value={memberId}
      onChange={e=>{setMemberId(e.target.value);setSelection(null);}}>
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
   <div className="smn-panel p-3">
    <h3 className="h6">{t("teamCalendar.collectiveHeading")}</h3>
    <div className="table-responsive">
     <table className="table table-bordered table-sm align-middle">
      <thead><tr><th scope="col">{t("teamCalendar.day")}</th>
       <th scope="col">{t("teamCalendar.assigned")}</th>
       <th scope="col">{t("teamCalendar.reportedUnavailable")}</th>
       <th scope="col">{t("teamCalendar.available")}</th>
       <th scope="col">{t("teamCalendar.unknown")}</th>
      </tr></thead>
      <tbody>{state.collective.map(d=><tr key={d.date}>
       <th scope="row">{d.date}</th>
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
     onClick={()=>setSelection(null)}>{t("teamCalendar.close")}</button>
    <MemberAbsenceEditor key={selection.memberId+":"+selection.date}
     memberId={selection.memberId} selectedOn={selection.date}
     onDirtyChange={()=>undefined}
     onSaved={()=>setRevision(n=>n+1)}/>
   </section>}
 </section>;
}
