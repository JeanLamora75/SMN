"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type MissingCode="no-assignments"|"ambiguous-assignment"|"assignment-version"|
 "work-calendar"|"member-country"|"national-coverage";
type Actual={
 status:"upcoming"|"in-progress"|"finished"|"closed";
 start:string;end:string;asOfDate:string;observedThrough:string|null;
 referenceJh:number|null;manualJh:number|null;retainedJh:number|null;
 source:"Saisie"|"Calcul"|"Non renseigné";revision:number;
 closedAt:string|null;closureEventId:string|null;
 initialJh:number|null;gapJh:number|null;missingSources:MissingCode[];
};
const numberText=(value:number)=>value.toLocaleString("fr-FR",{maximumFractionDigits:4});
const statusKey={
 upcoming:"upcoming", "in-progress":"inProgress",
 finished:"finished",closed:"closed"
} as const;
export default function ActualCapacityPanel({start,end}:{start:string;end:string}){
 const t=useTranslation();
 const [data,setData]=useState<Actual|null>(null);
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [isLoading,setIsLoading]=useState(true);
 const dirty=data!==null&&draft!==(data.manualJh===null?"":String(data.manualJh));
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 const refresh=async()=>{
  const params=new URLSearchParams({start,end});
  const res=await fetch("/api/admin/capacity-actual?"+params.toString(),{cache:"no-store"});
  if(!res.ok)throw Error("actual-load");
  const value=await res.json() as Actual;
  if(!value||typeof value.status!=="string")throw Error("actual-shape");
  setData(value);setDraft(value.manualJh===null?"":String(value.manualJh));
 };
 useEffect(()=>{
  let alive=true;
  setIsLoading(true);
  void (async()=>{
   try{
    const params=new URLSearchParams({start,end});
    const res=await fetch("/api/admin/capacity-actual?"+params.toString(),{cache:"no-store"});
    if(!res.ok)throw Error("load");
    const v=await res.json() as Actual;
    if(!v||typeof v.status!=="string")throw Error("shape");
    if(alive){setData(v);setDraft(v.manualJh===null?"":String(v.manualJh));}
   }catch{if(alive)setError(t("actualCapacity.loadError"));}
   finally{if(alive)setIsLoading(false);}
  })();
  return ()=>{alive=false;};
 },[start,end,t]);
 const modify=async(action:"set"|"clear")=>{
  if(!data||busy||data.status==="upcoming"||data.status==="closed")return;
  if(action==="set"){
   const n=Number(draft);
   if(draft.trim()===""||!Number.isFinite(n)||n<0||n>99999999.9999||
    Math.abs(Math.round(n*10000)-n*10000)>1e-6){
    setError(t("actualCapacity.invalid"));return;
   }
  }
  setBusy(true);setError("");setNotice("");
  try{
   const payload={action,start,end,revision:data.revision,
    ...(action==="set"?{manualJh:Number(draft)}:{})};
   const response=await fetch("/api/admin/capacity-actual",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
   });
   if(!response.ok){
    setError(t(response.status===423?"actualCapacity.protected":
     response.status===409?"actualCapacity.conflict":"actualCapacity.failed"));return;
   }
   await refresh();
   setNotice(t(action==="set"?"actualCapacity.saved":"actualCapacity.cleared"));
  }catch{setError(t("actualCapacity.failed"));}
  finally{setBusy(false);}
 };
 const close=async()=>{
  if(!data||busy||data.status!=="finished"||dirty)return;
  if(!window.confirm(t("actualCapacity.confirmClose")))return;
  setBusy(true);setError("");setNotice("");
  try{
   const response=await fetch("/api/admin/capacity-actual/close",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({start,end,eventId:crypto.randomUUID()})
   });
   if(!response.ok){setError(t("actualCapacity.failed"));return;}
   await refresh();
   setNotice(t("actualCapacity.closedNotice"));
  }catch{setError(t("actualCapacity.failed"));}
  finally{setBusy(false);}
 };
 const label=(code:MissingCode)=>t(("developmentCapacity."+
  ({ "no-assignments":"noAssignments","ambiguous-assignment":"ambiguousAssignment",
     "assignment-version":"assignmentVersion","work-calendar":"workCalendar",
     "member-country":"memberCountry","national-coverage":"nationalCoverage"}[code])
 ) as "developmentCapacity.noAssignments");
 return <section className="smn-panel p-3 d-grid gap-3" aria-labelledby="actual-capacity">
  <h2 id="actual-capacity" className="h5">{t("actualCapacity.title")}</h2>
  <p className="small text-secondary">{t("actualCapacity.intro")}</p>
  {isLoading&&<p role="status">{t("actualCapacity.loading")}</p>}
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  {notice&&<p className="alert alert-success" role="status">{notice}</p>}
  {data&&!isLoading&&<>
   <p>{t("actualCapacity.periodStatus")} : <strong>
    {t(("actualCapacity."+statusKey[data.status]) as "actualCapacity.upcoming")}
   </strong></p>
   {data.status==="upcoming"?<p>{t("actualCapacity.noFuture")}</p>:<>
    <p>{t("actualCapacity.observedThrough")}: {data.observedThrough??"—"}</p>
    <p>{t("actualCapacity.reference")}: {data.referenceJh===null?
     t("actualCapacity.unknown"):numberText(data.referenceJh)+" JH"}</p>
    <p>{t("actualCapacity.retained")}: <strong>{data.retainedJh===null?
     t("actualCapacity.unknown"):numberText(data.retainedJh)+" JH"}</strong></p>
    <p>{t("actualCapacity.provenance")}: {t(data.source==="Saisie"?
     "actualCapacity.manual":data.source==="Calcul"?
     "actualCapacity.calculated":"actualCapacity.unknown")}</p>
    <p>{t("actualCapacity.initial")}: {data.initialJh===null?
     t("actualCapacity.unknown"):numberText(data.initialJh)+" JH"}</p>
    {(data.status==="finished"||data.status==="closed")&&
     <p>{t("actualCapacity.gap")}: {data.gapJh===null?
      t("actualCapacity.gapUnknown"):numberText(data.gapJh)+" JH"}</p>}
    {data.missingSources.length>0&&<div>
     <p>{t("actualCapacity.missing")}</p>
     <ul>{data.missingSources.map(k=><li key={k}>{label(k)}</li>)}</ul>
    </div>}
    {data.status==="closed"?<p className="alert alert-secondary">
     {t("actualCapacity.closedImmutable")} {data.closedAt}</p>:<>
     <label htmlFor="actual-manual-jh" className="form-label">{t("actualCapacity.input")}</label>
     <input id="actual-manual-jh" type="number" className="form-control"
      min="0" max="99999999.9999" step="0.0001" value={draft}
      disabled={busy} onChange={e=>setDraft(e.target.value)}
      placeholder={t("actualCapacity.empty")}/>
     <p className="small text-secondary">{t("actualCapacity.zeroHint")}</p>
     <div className="d-flex flex-wrap gap-2">
      <button className="btn btn-primary" type="button" disabled={busy}
       onClick={()=>void modify("set")}>{t("actualCapacity.save")}</button>
      <button className="btn btn-outline-secondary" type="button"
       disabled={busy||data.manualJh===null}
       onClick={()=>void modify("clear")}>{t("actualCapacity.clear")}</button>
     </div>
     {data.status==="finished"&&<div className="border-top pt-3 d-grid gap-2">
      <p className="small">{t("actualCapacity.closeHint")}</p>
      <button className="btn btn-outline-danger align-self-start" type="button"
       disabled={busy||dirty} onClick={()=>void close()}>
       {t("actualCapacity.close")}</button>
     </div>}
    </>}
   </>}
   <p className="small text-secondary">{t("actualCapacity.noIndividualJudgment")}</p>
  </>}
 </section>;
}
