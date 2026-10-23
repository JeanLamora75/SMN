"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import type {AbsenceItem,AbsenceState} from "@/server/members/absence";

type State=AbsenceState&{today:string};
const compare=(a:AbsenceItem,b:AbsenceItem)=>
 b.startOn.localeCompare(a.startOn)||b.endOn.localeCompare(a.endOn)||
 b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id);

/** Liste unique et historisée : les tombstones restent visibles, mais ne comptent plus en capacité. */
export default function MemberAbsenceSummary({memberId,onCreate,onEdit}:{
 memberId:string;onCreate:()=>void;onEdit:(item:AbsenceItem)=>void;
}){
 const t=useTranslation();
 const [data,setData]=useState<State|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [busyId,setBusyId]=useState<string|null>(null);
 const [message,setMessage]=useState("");
 const fetchState=async()=>{
  const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/absences",
   {cache:"no-store"});
  if(!response.ok)throw Error("absence-read");
  const state=await response.json() as State;
  if(state.memberId!==memberId||!Array.isArray(state.absences)||typeof state.today!=="string")
   throw Error("absence-invalid");
  return state;
 };
 useEffect(()=>{
  let alive=true;
  void fetchState().then(state=>{if(alive){setData(state);setLoading(false);}})
   .catch(()=>{if(alive){setLoading(false);setError(t("members.absence.loadFailed"));}});
  return()=>{alive=false;};
 },[memberId,t]);
 const remove=async(record:AbsenceItem)=>{
  if(!data||data.archived||record.deleted||busyId)return;
  const past=record.endOn<data.today;
  const confirmText=(past?t("memberAbsences.pastWarning")+"\n\n":"")+
   t("memberAbsences.deleteConfirmation",{date:record.startOn});
  if(!window.confirm(confirmText))return;
  setBusyId(record.id);setError("");setMessage("");
  try{
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/absences",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"delete",id:record.id,revision:record.revision})
   });
   const result=await response.json() as {error?:string};
   if(!response.ok){
    setError(t(result.error==="conflict"?"members.absence.conflict":
     result.error==="not-found"?"members.absence.notFound":"members.absence.failed"));
    return;
   }
   // Les vues de capacité calculent les valeurs actualisées à chaque nouvelle lecture.
   setData(await fetchState());
   setMessage(t("memberAbsences.deleted"));
  }catch{setError(t("members.absence.failed"));}
  finally{setBusyId(null);}
 };
 const all=[...(data?.absences??[])].sort(compare);
 const upcoming=data?all.filter(record=>record.endOn>=data.today):[];
 const past=data?all.filter(record=>record.endOn<data.today):[];
 const renderRows=(items:AbsenceItem[])=>
  <div className="table-responsive">
   <table className="table table-sm align-middle">
    <thead><tr>
     <th scope="col">{t("members.absence.startOn")}</th>
     <th scope="col">{t("members.absence.endOn")}</th>
     <th scope="col">{t("members.absence.category")}</th>
     <th scope="col">{t("members.absence.reason")}</th>
     <th scope="col">{t("members.absence.type")}</th>
     <th scope="col">{t("memberAbsences.status")}</th>
     <th scope="col">{t("members.absence.action")}</th>
    </tr></thead>
    <tbody>{items.map(record=><tr key={record.id} className={record.deleted?"text-secondary":""}>
     <td><time dateTime={record.startOn}>{record.startOn}</time>
      <span className="small d-block text-secondary">
       {t(record.startSlot==="morning"?"members.calendar.morning":"members.calendar.afternoon")}
      </span></td>
     <td><time dateTime={record.endOn}>{record.endOn}</time>
      <span className="small d-block text-secondary">
       {t(record.endSlot==="morning"?"members.calendar.morning":"members.calendar.afternoon")}
      </span></td>
     <td><span className="rounded-circle d-inline-block me-2" aria-hidden="true"
      style={{width:"0.8em",height:"0.8em",backgroundColor:record.categoryColor}}/>
      {record.categoryName}</td>
     <td>{record.reason}</td>
     <td>{t(record.isPlanned?"members.absence.plannedShort":"members.absence.unplanned")}</td>
     <td>{record.deleted?<span className="badge text-bg-secondary">{t("memberAbsences.deletedStatus")}</span>:
      record.endOn<data!.today?t("memberAbsences.past"):t("memberAbsences.upcoming")}</td>
     <td><div className="d-flex gap-2 flex-wrap">
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>onEdit(record)}
       disabled={data!.archived||record.deleted||busyId!==null}>
       {t("members.absence.edit")}</button>
      <button type="button" className="btn btn-outline-danger btn-sm"
       onClick={()=>void remove(record)} disabled={data!.archived||record.deleted||busyId!==null}>
       {t("memberAbsences.delete")}</button>
     </div></td>
    </tr>)}</tbody>
   </table>
  </div>;
 return <div className="d-grid gap-3">
  <div className="border rounded p-3">
   <button type="button" className="btn btn-outline-primary"
    disabled={loading||!data||data.archived||busyId!==null} onClick={onCreate}>
    + {t("memberAbsences.add")}</button>
  </div>
  {loading&&<p role="status">{t("members.absence.loading")}</p>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {message&&<p role="status" className="alert alert-success">{message}</p>}
  {data&&<>
   {data.archived&&<p className="alert alert-secondary">{t("members.calendar.archived")}</p>}
   <section aria-labelledby="member-absence-upcoming"><h3 className="h6" id="member-absence-upcoming">
    {t("memberAbsences.upcoming")}</h3>
    {upcoming.length?renderRows(upcoming):<p className="text-secondary">{t("memberAbsences.noneUpcoming")}</p>}
   </section>
   <section aria-labelledby="member-absence-past"><h3 className="h6" id="member-absence-past">
    {t("memberAbsences.past")}</h3>
    {past.length?renderRows(past):<p className="text-secondary">{t("memberAbsences.nonePast")}</p>}
   </section>
   <p className="small text-secondary">{t("memberAbsences.capacityNotice")}</p>
  </>}
 </div>;
}
