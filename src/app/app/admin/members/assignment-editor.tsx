"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type Shares={scrumMaster:number;productOwner:number;developer:number};
type Version={revision:number;effectiveFrom:string;contractPercent:number;
 allocationPercent:number;contributionPercent:number;shares:Shares;developerShare:number};
type AssignmentState={memberId:string;teamId:string;assignmentId:string|null;
 startOn:string|null;endOn:string|null;endReason?:string|null;today:string;latestRevision:number;memberRevision?:number;
 current:Version|null;versions:Version[]};
type Kind="loading"|"ready"|"error";
type Draft={effectiveFrom:string;contractPercent:string;allocationPercent:string;
 contributionPercent:string;scrumMaster:string;productOwner:string;developer:string};
function draftFrom(state:AssignmentState):Draft{
 const baseline=state.versions.at(-1)??null;
 return {
  effectiveFrom:baseline&&baseline.effectiveFrom>state.today?baseline.effectiveFrom:state.today,
  contractPercent:String(baseline?.contractPercent??100),
  allocationPercent:String(baseline?.allocationPercent??100),
  contributionPercent:String(baseline?.contributionPercent??100),
  scrumMaster:String(baseline?.shares.scrumMaster??0),
  productOwner:String(baseline?.shares.productOwner??0),
  developer:String(baseline?.shares.developer??100)
 };
}
const num=(s:string)=>/^(0|[1-9][0-9]{0,2})$/.test(s)?Number(s):NaN;
export default function AssignmentEditor({memberId,teamId,memberRevision,onSaved,onCancel,onDirtyChange,teamScoped=false}:{
 memberId:string;teamId:string;teamName:string;memberRevision:number;onSaved:()=>void;onCancel:()=>void;onDirtyChange?:(dirty:boolean,busy:boolean)=>void;teamScoped?:boolean;
}){
 const t=useTranslation();
 const [state,setState]=useState<AssignmentState|null>(null);
 const [draft,setDraft]=useState<Draft|null>(null);
 const [baseline,setBaseline]=useState<Draft|null>(null);
 const [status,setStatus]=useState<Kind>("loading");
 const [busy,setBusy]=useState(false);
 const [historicalStart,setHistoricalStart]=useState("");
 const [endOn,setEndOn]=useState("");
 const [endReason,setEndReason]=useState("");
 const [error,setError]=useState("");
 const dirty=draft!==null&&baseline!==null&&JSON.stringify(draft)!==JSON.stringify(baseline);
 useUnsavedChanges(Boolean(dirty||busy),t("draft.leaveWarning"));
 useEffect(()=>{onDirtyChange?.(Boolean(dirty),busy);},[dirty,busy,onDirtyChange]);
 useEffect(()=>{
  let active=true;
  void fetch("/api/admin/members/"+encodeURIComponent(memberId)+(teamScoped?"/team-assignment?"+new URLSearchParams({teamId}):"/assignment"),{cache:"no-store"})
   .then(async r=>{if(!r.ok)throw new Error("load-failed");return r.json() as Promise<AssignmentState>;})
   .then(data=>{if(!active)return;
    if(data.memberId!==memberId||data.teamId!==teamId||!Array.isArray(data.versions))throw new Error("wrong-team");
    const start=draftFrom(data);setState(data);setDraft(start);setBaseline(start);setHistoricalStart(data.startOn??"");setEndOn(data.endOn??"");setEndReason(data.endReason??"");setStatus("ready");
   }).catch(()=>{if(active)setStatus("error");});
  return ()=>{active=false;};
 },[memberId,teamId,teamScoped]);
 const change=(key:keyof Draft,value:string)=>setDraft(current=>current?{...current,[key]:value}:current);
 const cancel=()=>{if(busy)return;if(dirty&&!window.confirm(t("draft.discardWarning")))return;onCancel();};
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!state||!draft||busy)return;
  const contractPercent=num(draft.contractPercent),allocationPercent=num(draft.allocationPercent);
  const contributionPercent=num(draft.contributionPercent);
  const shares={scrumMaster:num(draft.scrumMaster),productOwner:num(draft.productOwner),
   developer:num(draft.developer)};
  if(!Object.values({...shares,contractPercent,allocationPercent,contributionPercent})
   .every(value=>Number.isSafeInteger(value)&&value>=0&&value<=100)||
   Object.values(shares).reduce((sum,n)=>sum+n,0)!==100||
   allocationPercent>contractPercent){
   setError(t("members.assignment.invalidShares"));return;
  }
  if(draft.effectiveFrom<state.today||
   (state.versions.length>0&&draft.effectiveFrom<state.versions.at(-1)!.effectiveFrom)){
   setError(t("members.assignment.invalidDate"));return;
  }
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+(teamScoped?"/team-assignment":"/assignment"),{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({memberId,teamId,effectiveFrom:draft.effectiveFrom,contractPercent,
     allocationPercent,contributionPercent,shares,revision:state.latestRevision})
   });
   const payload=await response.json() as {error?:string};
   if(!response.ok){
    setError(t(response.status===409?"members.assignment.conflict":
     response.status===404?"members.assignment.notFound":
     response.status===400?"members.assignment.invalidShares":"members.assignment.failed"));
    return;
   }
   onSaved();
  }catch{setError(t("members.assignment.failed"));}
  finally{setBusy(false);}
 }
 async function closeTeamAssignment(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!teamScoped||!state?.assignmentId||!state.startOn||busy)return;
  if(!endOn||endOn<state.startOn){
   setError("La date de fin ne peut pas précéder la date de début de l'affectation.");return;
  }
  if(state.endOn===endOn&&(state.endReason??"")===endReason)return;
  if(!window.confirm((state.endOn?"Confirmer la correction de cette affectation au ":"Confirmer la fin de cette affectation au ")+endOn+" ? Le membre ne sera pas archivé."))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/team-assignment/end",{
    method:state.endOn?"PATCH":"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,assignmentId:state.assignmentId,endOn,
     ...(state.endOn?{expectedEndOn:state.endOn}:{}),
     reason:endReason.trim()||null,revision:state.memberRevision??memberRevision,
     latestRevision:state.latestRevision})
   });
   const payload=await response.json() as {error?:string};
   if(!response.ok){
    setError(payload.error==="conflict"?"L'affectation a été modifiée. Rouvre la fenêtre.":
     payload.error==="invalid-date"?
      "La date de fin ne peut pas précéder le début de l'affectation.":
     payload.error==="overlap"?"La date chevauche une autre affectation dans cette équipe.":
      "Impossible d'enregistrer la fin de l'affectation.");return;
   }
   onSaved();
  }catch{setError("Service temporairement indisponible.");}
  finally{setBusy(false);}
 }
 async function correctHistoricalStart(){
  if(!state?.assignmentId||!state.startOn||!historicalStart||historicalStart>=state.startOn||busy)return;
  if(!window.confirm(t("members.assignment.historicalConfirm",{current:state.startOn,next:historicalStart})))return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/members/"+encodeURIComponent(memberId)+"/assignment/start-date",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({assignmentId:state.assignmentId,newStartOn:historicalStart,
     revision:state.memberRevision??memberRevision,...(teamScoped?{teamId}:{})})
   });
   if(!r.ok)throw Error("historical-correction-failed");
   onSaved();
  }catch{setError(t("members.assignment.historicalFailure"));}
  finally{setBusy(false);}
 }
 return <section className="smn-panel p-4 d-grid gap-3" aria-label={t("members.assignment.heading")}>
  {status==="loading"&&<p role="status">{t("members.assignment.loading")}</p>}
  {status==="error"&&<p role="alert" className="alert alert-warning">{t("members.assignment.loadFailed")}</p>}
  {state&&draft&&status==="ready"&&<>
   {(!teamScoped||state.endOn===null)&&<form onSubmit={submit} className="d-grid gap-3">
    <div className="row g-3">
     <div className="col-md-4">
      <label htmlFor="effective-from" className="form-label">{t("members.assignment.effectiveFrom")}</label>
      <input id="effective-from" type="date" className="form-control" required
       min={state.versions.at(-1)?.effectiveFrom&&state.versions.at(-1)!.effectiveFrom>state.today?
        state.versions.at(-1)!.effectiveFrom:state.today}
       value={draft.effectiveFrom} disabled={busy}
       onChange={e=>change("effectiveFrom",e.target.value)}/>
     </div>
    </div>
    <div className="row g-3">
     {([
      ["contractPercent","members.assignment.contract"],
      ["allocationPercent","members.assignment.allocation"],
      ["contributionPercent","members.assignment.contribution"]
     ] as const).map(([field,key])=><div className="col-md-4" key={field}>
      <label className="form-label" htmlFor={field}>{t(key)}</label>
      <input className="form-control" id={field} type="number" required
       min={0} max={100} step={1} value={draft[field]} disabled={busy}
       onChange={e=>change(field,e.target.value)}/>
     </div>)}
    </div>
    <h4 className="h6 mb-0">{t("members.assignment.sharesTitle")}</h4>
    <div className="row g-3">
     {([
      ["scrumMaster","members.roles.scrumMaster"],
      ["productOwner","members.roles.productOwner"],
      ["developer","members.roles.developer"]
     ] as const).map(([field,key])=><div className="col-sm-4" key={field}>
      <label className="form-label" htmlFor={"share-"+field}>{t(key)}</label>
      <input className="form-control" id={"share-"+field} type="number" required
       min={0} max={100} step={1} disabled={busy} value={draft[field]}
       onChange={e=>change(field,e.target.value)}/>
     </div>)}
    </div>
    <p className="small text-secondary">{t("members.assignment.rules")}</p>
    {error&&<p role="alert" className="alert alert-warning mb-0">{error}</p>}
    <div className="smn-cockpit-form-actions">
     <button type="submit" disabled={busy||(!dirty&&state.versions.length>0)} className="btn btn-primary">
      {t(busy?"members.assignment.saving":"members.assignment.save")}</button>
     <button type="button" disabled={busy} className="btn btn-outline-secondary" onClick={cancel}>
      {t("members.profile.cancel")}</button>
    </div>
   </form>}
   {teamScoped&&state.assignmentId&&state.startOn&&<form onSubmit={closeTeamAssignment}
    className="border rounded-3 p-3 d-grid gap-3">
    <h4 className="h6 mb-0">Fin d'affectation à l'équipe</h4>
    <>
     {state.endOn&&<p className="small text-secondary mb-0">Affectation terminée le {state.endOn}. Vous pouvez corriger la date et le motif sans effacer l'historique.</p>}
     <p className="small text-secondary mb-0">Cette opération ferme uniquement l'affectation dans l'équipe.
      Elle n'archive pas le membre et conserve son historique.</p>
     <div className="row g-3">
      <label className="col-md-5">Date de fin d'affectation
       <input type="date" className="form-control mt-1" required
        min={state.startOn}
        value={endOn} onChange={e=>setEndOn(e.target.value)} disabled={busy}/>
      </label>
      <label className="col-md-7">Motif de sortie (facultatif)
       <select className="form-select mt-1" value={endReason} onChange={e=>setEndReason(e.target.value)}
        disabled={busy}>
        <option value="">Non précisé</option>
        <option value="fin de contrat">Fin de contrat</option>
        <option value="changement d'équipe">Changement d'équipe</option>
        <option value="autre">Autre</option>
        {endReason&&!["fin de contrat","changement d\x27équipe","autre"].includes(endReason)&&
         <option value={endReason}>{endReason}</option>}
       </select>
      </label>
     </div>
     <button type="submit" className="btn btn-outline-primary align-self-start"
      disabled={busy||!endOn||(state.endOn===endOn&&(state.endReason??"")===endReason)}>
      {state.endOn?"Corriger la fin d’affectation":"Enregistrer la fin d’affectation"}</button>
    </>
   </form>}
   {state.assignmentId&&state.startOn&&(!teamScoped||state.endOn===null)&&<div className="border rounded-3 p-3">
    <h4 className="h6">{t("members.assignment.historicalTitle")}</h4>
    <p className="small text-secondary">{t("members.assignment.historicalDescription",{date:state.startOn})}</p>
    <div className="d-flex flex-wrap align-items-end gap-2">
     <label className="form-label mb-0">{t("members.assignment.historicalRealDate")}
      <input type="date" className="form-control" max={state.startOn} value={historicalStart} disabled={busy}
       onChange={e=>setHistoricalStart(e.target.value)}/></label>
     <button type="button" className="btn btn-primary smn-member-assignment-historical-action" disabled={busy||!historicalStart||historicalStart>=state.startOn}
      onClick={()=>void correctHistoricalStart()}>{t("members.assignment.historicalAction")}</button>
    </div>
   </div>}
  </>}
  {status==="error"&&<button type="button" className="btn btn-outline-secondary align-self-start" onClick={onCancel}>{t("members.profile.cancel")}</button>}
 </section>;
}
