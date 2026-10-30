"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import {sprintZonedInput,sprintZonedToIso} from "@/lib/sprint-detail-time";
import BootstrapIcon from "../../../bootstrap-icon";

type Props={kind:"name"|"dates";sprintId:string;name:string;
 startAt:string;endAt:string;timeZone:string};
type RescheduleInput={sprintId:string;startAt:string;endAt:string;mode:"keep"};
type OutsideEvent={id:string;name:string;kind:string;status:string;startAt:string;endAt:string;removable:boolean};
type Preview={token:string;input:RescheduleInput;impact?:{
 goalCount:number;storyPoints:unknown;initialCapacityJh:number|null;
 manualActualJh:number|null;recalculatedReferenceJh:number|null;
 missingSources:string[]};warnings?:OutsideEvent[]};

export default function SprintDetailEditor(props:Props){
 const t=useTranslation(),router=useRouter();
 const dialog=useRef<HTMLDialogElement>(null);
 const [opened,setOpened]=useState(false),[busy,setBusy]=useState(false);
 const [name,setName]=useState(props.name);
 const [start,setStart]=useState(sprintZonedInput(props.startAt,props.timeZone)??"");
 const [end,setEnd]=useState(sprintZonedInput(props.endAt,props.timeZone)??"");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [removeCeremonies,setRemoveCeremonies]=useState<string[]>([]);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const isName=props.kind==="name";
 const title=t(isName?"sprintDetail.editNameTitle":"sprintDetail.editDatesTitle");
 const titleId="smn-sprint-edit-"+props.kind;
 useEffect(()=>{
  const d=dialog.current;
  if(opened&&d&&!d.open)d.showModal();
  return()=>{if(d?.open)d.close();};
 },[opened]);
 const open=()=>{
  setName(props.name);
  setStart(sprintZonedInput(props.startAt,props.timeZone)??"");
  setEnd(sprintZonedInput(props.endAt,props.timeZone)??"");
  setPreview(null);setRemoveCeremonies([]);setError("");setNotice("");setOpened(true);
 };
 const dismiss=()=>{if(!busy){setOpened(false);setPreview(null);setError("");}};
 async function rename(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(busy||!name.trim()||name.trim().length>160)return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/sprints/"+encodeURIComponent(props.sprintId),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:name.trim()})});
   const data=await r.json();
   if(!r.ok||!data.ok)throw Error("rename");
   setNotice(t(data.duplicate?"sprintDetail.savedDuplicate":"sprintDetail.savedName"));
   setOpened(false);router.refresh();
  }catch{setError(t("sprintDetail.saveError"));}
  finally{setBusy(false);}
 }
 function resolveInput():RescheduleInput|null{
  const a=sprintZonedToIso(start,props.timeZone,props.startAt);
  const b=sprintZonedToIso(end,props.timeZone,props.endAt);
  if(!a.ok||!b.ok){
   const fail=!a.ok?a.error:!b.ok?b.error:"invalid";
   setError(t(fail==="ambiguous"?"sprintDetail.ambiguousTime":
    fail==="nonexistent"?"sprintDetail.nonexistentTime":"sprintDetail.invalidDates"));
   return null;
  }
  if(Date.parse(a.iso)>=Date.parse(b.iso)){
   setError(t("sprintDetail.invalidDates"));return null;
  }
  return {sprintId:props.sprintId,startAt:a.iso,endAt:b.iso,mode:"keep"};
 }
 async function checkDates(){
  if(busy)return;
  setError("");setPreview(null);setRemoveCeremonies([]);
  const input=resolveInput();if(!input)return;
  if(input.startAt===props.startAt&&input.endAt===props.endAt){
   setError(t("sprintDetail.noChange"));return;
  }
  setBusy(true);
  try{
   const r=await fetch("/api/admin/sprints/reschedule",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
   const data=await r.json();
   if(!r.ok||!data.ok||typeof data.token!=="string"){
    const message=data.error==="not-found"?"Sprint introuvable dans l’équipe active.":
     data.error==="closed-period"?"Ce Sprint est clôturé et ne peut pas être replanifié.":
     data.error==="sprint-overlap"?"La période chevauche un autre Sprint de cette équipe.":
     data.error==="events-outside-new-period"?"Des événements existants sortent de la nouvelle période.":
     data.error==="recalculation-not-supported"?"Le recalcul automatique n’est pas disponible pour cette opération.":
     data.error==="unavailable"?"Prévisualisation indisponible : erreur du serveur. Consultez le terminal.":
     t("sprintDetail.previewError");
    setError(message);return;
   }
   setPreview({token:data.token,input,impact:data.impact,warnings:data.warnings});
  }catch{setError(t("sprintDetail.previewError"));}
  finally{setBusy(false);}
 }
 async function confirmDates(){
  if(busy||!preview||preview.warnings?.some(w=>!w.removable||!removeCeremonies.includes(w.id)))return;
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/sprints/reschedule",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({input:preview.input,token:preview.token,removeCeremonies})});
   const data=await r.json();
   if(!r.ok||!data.ok){
    const reason=data.error==="stale-preview"?
     "La prévisualisation a expiré : les événements ou les dates ont changé. Relancez la prévisualisation.":
     data.error==="events-outside-new-period"?
     "Des cérémonies ont changé ou ne peuvent pas être supprimées. Relancez la prévisualisation.":
     data.error==="invalid-input"?
     "La sélection des cérémonies n'est pas valide. Relancez la prévisualisation.":
     data.error==="unavailable"?
     "Erreur serveur pendant l'enregistrement. Consultez le journal « sprint-reschedule-confirm-failed ».":
     t("sprintDetail.saveError");
    setError(reason);setPreview(null);return;
   }
   setOpened(false);setPreview(null);setNotice(t("sprintDetail.savedDates"));router.refresh();
  }catch{setError("La connexion a échoué pendant l'enregistrement. Réessayez après vérification.");setPreview(null);}
  finally{setBusy(false);}
 }
 return <>
  <button type="button" className="btn btn-link btn-sm p-1 align-self-center"
   title={t(isName?"sprintDetail.editName":"sprintDetail.editDates")}
   aria-label={t(isName?"sprintDetail.editName":"sprintDetail.editDates")}
   onClick={open}><BootstrapIcon name="pencil-square"/></button>
  {notice&&<span role="status" className="visually-hidden">{notice}</span>}
  {opened&&<dialog ref={dialog} className="smn-sprint-edit-dialog"
   aria-labelledby={titleId} onCancel={e=>{if(busy)e.preventDefault();else dismiss();}}>
   <div className="modal-content smn-cockpit-modal">
    <div className="smn-cockpit-modal-header">
     <h2 className="h5 mb-0" id={titleId}>{title}</h2>
     <button type="button" className="btn-close" aria-label={t("sprintDetail.close")}
      onClick={dismiss} disabled={busy}/>
    </div>
    <div className="smn-cockpit-modal-body">
    {isName?<form onSubmit={rename} className="d-grid gap-3">
     <div><label className="form-label" htmlFor="smn-sprint-edit-name">{t("sprintDetail.name")}</label>
      <input autoFocus id="smn-sprint-edit-name" className="form-control"
       value={name} maxLength={160} required onChange={e=>setName(e.target.value)}
       disabled={busy}/></div>
     <div className="d-flex justify-content-end flex-wrap gap-2">
      <button type="button" className="btn btn-outline-secondary" onClick={dismiss}
       disabled={busy}>{t("sprintDetail.cancel")}</button>
      <button type="submit" className="btn btn-primary"
       disabled={busy||!name.trim()||name.trim()===props.name}>{t("sprintDetail.save")}</button>
     </div>
    </form>:<div className="d-grid gap-3">
     <p className="small text-secondary mb-0">
      {t("sprintDetail.zoneNotice",{zone:props.timeZone})}</p>
     <div><label className="form-label" htmlFor="smn-sprint-edit-start">{t("sprintDetail.startAt")}</label>
      <input autoFocus id="smn-sprint-edit-start" type="datetime-local" step="1"
       className="form-control" value={start} disabled={busy}
       onChange={e=>{setStart(e.target.value);setPreview(null);setError("");}}/></div>
     <div><label className="form-label" htmlFor="smn-sprint-edit-end">{t("sprintDetail.endAt")}</label>
      <input id="smn-sprint-edit-end" type="datetime-local" step="1"
       className="form-control" value={end} disabled={busy}
       onChange={e=>{setEnd(e.target.value);setPreview(null);setError("");}}/></div>
     <p className="small text-secondary mb-0">{t("sprintDetail.keepRule")}</p>
     {preview&&<div className="alert alert-info mb-0" role="status">
      <h3 className="h6">{t("sprintDetail.impactTitle")}</h3>
      <ul className="mb-1">
       <li>{t("sprintDetail.impactGoals")} : {preview.impact?.goalCount??t("sprintDetail.missing")}</li>
       <li>{t("sprintDetail.impactInitial")} : {preview.impact?.initialCapacityJh??t("sprintDetail.missing")}</li>
       <li>{t("sprintDetail.impactManual")} : {preview.impact?.manualActualJh??t("sprintDetail.missing")}</li>
       <li>{t("sprintDetail.impactReference")} : {preview.impact?.recalculatedReferenceJh??t("sprintDetail.missing")}</li>
      </ul>
      {preview.warnings?.length?<div className="mt-2">
       <p className="fw-semibold mb-2">Cérémonies hors de la nouvelle période ({preview.warnings.length})</p>
       {preview.warnings.map(event=><div key={event.kind+event.id} className="border rounded p-2 mb-2">
        <label className="d-flex gap-2 align-items-start">
         <input type="checkbox" className="form-check-input mt-1" disabled={!event.removable||busy}
          checked={removeCeremonies.includes(event.id)}
          onChange={e=>setRemoveCeremonies(current=>e.target.checked?[...current,event.id]:current.filter(id=>id!==event.id))}/>
         <span><strong>{event.name||event.kind}</strong> · {event.status}
          <span className="d-block small">{event.startAt} — {event.endAt}</span>
          <span className="d-block small">{event.removable?"Retirer cette cérémonie planifiée lors de la confirmation":"Événement protégé : déplacement ou suppression indisponible"}</span>
         </span>
        </label>
       </div>)}
      </div>:null}
      {preview.impact?.missingSources?.length?<p>{t("sprintReschedule.missingSources")} : {preview.impact.missingSources.join(", ")}</p>:null}
     </div>}
     <div className="d-flex justify-content-end flex-wrap gap-2">
      <button type="button" className="btn btn-outline-secondary"
       disabled={busy} onClick={dismiss}>{t("sprintDetail.cancel")}</button>
      {preview?<button type="button" className="btn btn-primary"
       onClick={confirmDates} disabled={busy||Boolean(preview.warnings?.some(w=>!w.removable||!removeCeremonies.includes(w.id)))}>{t("sprintDetail.confirm")}</button>:
       <button type="button" className="btn btn-primary" disabled={busy||!start||!end}
        onClick={checkDates}>{t("sprintDetail.preview")}</button>}
     </div>
    </div>}
    {error&&<p role="alert" className="alert alert-warning mt-3 mb-0">{error}</p>}
    </div>
   </div>
  </dialog>}
 </>;
}
