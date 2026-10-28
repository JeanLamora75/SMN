"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import type {AbsenceItem,AbsenceState,AbsenceSlot} from "@/server/members/absence";

type Draft={categoryId:string;startOn:string;endOn:string;startSlot:AbsenceSlot;
 endSlot:AbsenceSlot;isPlanned:boolean;reason:string};
const initial=(today:string,record:AbsenceItem|null):Draft=>record?{
 categoryId:record.categoryId,startOn:record.startOn,endOn:record.endOn,
 startSlot:record.startSlot,endSlot:record.endSlot,isPlanned:record.isPlanned,reason:record.reason
}:{categoryId:"",startOn:today,endOn:today,startSlot:"morning",
 endSlot:"afternoon",isPlanned:true,reason:""};

/** Une fenêtre = création OU correction d'une seule absence, jamais son historique. */
export default function MemberAbsenceEditor({memberId,teamId,record,initialDate,onSaved,onCancel,onDirtyChange}:{
 memberId:string;teamId?:string;record:AbsenceItem|null;initialDate?:string;onSaved:()=>void;onCancel:()=>void;onDirtyChange?:(dirty:boolean,busy:boolean)=>void;
}){
 const t=useTranslation();
 const [state,setState]=useState<AbsenceState|null>(null);
 const [today,setToday]=useState("");
 const [draft,setDraft]=useState<Draft|null>(null);
 const [baseline,setBaseline]=useState<Draft|null>(null);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const dirty=Boolean(draft&&baseline&&JSON.stringify(draft)!==JSON.stringify(baseline));
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 useEffect(()=>{onDirtyChange?.(Boolean(dirty),busy);},[dirty,busy,onDirtyChange]);
 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+
   (teamId?"/team-absence?"+new URLSearchParams({teamId,onDate:initialDate??""}):"/absences"),{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("absence-load-failed");return r.json() as Promise<AbsenceState&{today:string}>;})
   .then(data=>{
    if(!active)return;
    if(data.memberId!==memberId||!Array.isArray(data.categories)||!Array.isArray(data.absences)||
       typeof data.today!=="string")throw Error("absence-invalid");
    if(record){
     const latest=data.absences.find(item=>item.id===record.id);
     if(!latest||latest.deleted||latest.revision!==record.revision)
      throw Error("absence-stale");
    }
    const values=initial(initialDate??data.today,record);
    setState(data);setToday(data.today);setDraft(values);setBaseline(values);setStatus("ready");
   }).catch(()=>{if(active)setStatus("error");});
  return()=>{active=false;};
 },[memberId,teamId,record,initialDate]);
 const change=<K extends keyof Draft>(name:K,value:Draft[K])=>
  setDraft(current=>current?{...current,[name]:value}:current);
 const cancel=()=>{
  if(busy)return;
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  onCancel();
 };
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(!state||!draft||busy||state.archived)return;
  setBusy(true);setError("");
  try{
   const payload={action:record?"update":"create",...(record?{id:record.id}:{}),
    revision:record?.revision??0,...draft};
   const r=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+
    (teamId?"/team-absence":"/absences"),{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(teamId?{teamId,change:payload}:payload)
   });
   const result=await r.json() as {error?:string};
   if(!r.ok){
    const keys:Record<string,string>={
     "reason-required":"reasonRequired","category-required":"categoryRequired",
     "category-inactive":"categoryInactive","invalid-period":"invalidPeriod",
     overlap:"overlap",conflict:"conflict",archived:"archived","not-found":"notFound",
     "invalid-input":"invalidInput"};
    setError(t(("members.absence."+(keys[result.error??""]??"failed")) as "members.absence.failed"));
    return;
   }
   onSaved();
  }catch{setError(t("members.absence.failed"));}
  finally{setBusy(false);}
 };
 return <section className="smn-panel p-4 d-grid gap-3" aria-labelledby="absence-edit-title">
  <h3 id="absence-edit-title" className="h5">{t(record?"members.absence.editTitle":"members.absence.newTitle")}</h3>
  {status==="loading"&&<p role="status">{t("members.absence.loading")}</p>}
  {status==="error"&&<p role="alert" className="alert alert-warning">{t("members.absence.loadFailed")}</p>}
  {state&&draft&&status==="ready"&&<>
   {state.archived&&<p className="alert alert-secondary">{t("members.calendar.archived")}</p>}
   {(draft.startOn<today||Boolean(record&&record.startOn<today))&&<p role="status" className="alert alert-warning">
    {t("memberAbsences.pastWarning")}</p>}
   <form onSubmit={submit} className="d-grid gap-3">
    <div className="row g-3">
     <div className="col-md-6"><label className="form-label" htmlFor="absence-start">
      {t("members.absence.startOn")}</label>
      <input id="absence-start" className="form-control" type="date" min="1900-01-01"
       max="2200-12-31" value={draft.startOn} required disabled={busy||state.archived}
       onChange={event=>change("startOn",event.target.value)}/></div>
     <div className="col-md-6"><label className="form-label" htmlFor="absence-end">
      {t("members.absence.endOn")}</label>
      <input id="absence-end" className="form-control" type="date" min="1900-01-01"
       max="2200-12-31" value={draft.endOn} required disabled={busy||state.archived}
       onChange={event=>change("endOn",event.target.value)}/></div>
     <div className="col-md-6"><label className="form-label" htmlFor="absence-start-slot">
      {t("members.absence.startSlot")}</label>
      <select id="absence-start-slot" className="form-select" value={draft.startSlot}
       disabled={busy||state.archived} onChange={event=>change("startSlot",event.target.value as AbsenceSlot)}>
       <option value="morning">{t("members.calendar.morning")}</option>
       <option value="afternoon">{t("members.calendar.afternoon")}</option></select></div>
     <div className="col-md-6"><label className="form-label" htmlFor="absence-end-slot">
      {t("members.absence.endSlot")}</label>
      <select id="absence-end-slot" className="form-select" value={draft.endSlot}
       disabled={busy||state.archived} onChange={event=>change("endSlot",event.target.value as AbsenceSlot)}>
       <option value="morning">{t("members.calendar.morning")}</option>
       <option value="afternoon">{t("members.calendar.afternoon")}</option></select></div>
    </div>
    <div><label className="form-label" htmlFor="absence-category">{t("members.absence.category")}</label>
     <select id="absence-category" className="form-select" required value={draft.categoryId}
      disabled={busy||state.archived} onChange={event=>change("categoryId",event.target.value)}>
      <option value="">{t("members.absence.selectCategory")}</option>
      {state.categories.filter(c=>c.isActive||c.id===draft.categoryId).map(c=>
       <option key={c.id} value={c.id} disabled={!c.isActive&&c.id!==draft.categoryId}>
        {c.name}{!c.isActive?" ("+t("members.absence.inactive")+")":""}
       </option>)}</select></div>
    <div><label className="form-label" htmlFor="absence-reason">{t("members.absence.reason")}</label>
     <input id="absence-reason" className="form-control" required maxLength={200}
      value={draft.reason} disabled={busy||state.archived}
      onChange={event=>change("reason",event.target.value)}/>
     <p className="small text-secondary">{t("members.absence.noMedicalDetail")}</p></div>
    <label className="form-check-label"><input type="checkbox" className="form-check-input me-2"
     checked={draft.isPlanned} disabled={busy||state.archived}
     onChange={event=>change("isPlanned",event.target.checked)}/>
     {t("members.absence.planned")}</label>
    {error&&<p role="alert" className="alert alert-warning mb-0">{error}</p>}
    <div className="smn-cockpit-form-actions">
     <button className="btn btn-primary" type="submit" disabled={busy||state.archived}>
      {t(record?"members.absence.saveEdit":"members.absence.save")}</button>
     <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={cancel}>
      {t("members.profile.cancel")}</button>
    </div>
   </form>
  </>}
  {status==="error"&&<button type="button" className="btn btn-outline-secondary align-self-start"
   onClick={cancel}>{t("members.profile.cancel")}</button>}
 </section>;
}
