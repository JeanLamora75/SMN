"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {useTranslation} from "@/i18n/client";
import BootstrapIcon from "../../bootstrap-icon";

type Context={teamId:string;name:string;productName:string;vision:string|null;
 productGoal:string|null;revision:number};
type Version={revision:number;name:string;productName:string|null;vision:string|null;
 productGoal:string|null;changedAt:string};
type Response={context:Context;history:Version[]};
type Saved={ok:true;changed:boolean;context:Context}|
 {ok:false;error:string};
export default function TeamContextEditor({teamId,teamName,onSaved}:{
 teamId:string;teamName:string;onSaved:(context:Context)=>void;
}){
 const t=useTranslation(),router=useRouter();
 const dialog=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false);
 const [saving,setSaving]=useState(false),[error,setError]=useState("");
 const [data,setData]=useState<Response|null>(null);
 const [name,setName]=useState(teamName),[productName,setProductName]=useState("");
 const [vision,setVision]=useState("");
 const [goal,setGoal]=useState("");
 const dirty=!!data&&(name!==data.context.name||
  productName!==data.context.productName||
  vision!==(data.context.vision??"")||goal!==(data.context.productGoal??""));
 useEffect(()=>{
  const element=dialog.current;
  if(open&&element&&!element.open)element.showModal();
  return()=>{if(element?.open)element.close();};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const prevent=(event:BeforeUnloadEvent)=>{if(dirty){
   event.preventDefault();event.returnValue="";
  }};
  window.addEventListener("beforeunload",prevent);
  return()=>window.removeEventListener("beforeunload",prevent);
 },[open,dirty]);
 async function begin(){
  if(loading)return;
  setLoading(true);setError("");
  try{
   const res=await fetch("/api/admin/team-context?"+new URLSearchParams({teamId}),
    {cache:"no-store"});
   if(!res.ok)throw Error("load");
   const json=await res.json() as Response;
   if(!json.context||json.context.teamId!==teamId)throw Error("scope");
   setData(json);setName(json.context.name);setProductName(json.context.productName);
   setVision(json.context.vision??"");setGoal(json.context.productGoal??"");
   setOpen(true);
  }catch{setError(t("teamUX.contextLoadFailed"));}
  finally{setLoading(false);}
 }
 function dismiss(){
  if(saving)return;
  if(dirty&&!window.confirm(t("teamUX.contextDiscard")))return;
  setOpen(false);setError("");trigger.current?.focus();
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!data||saving||!name.trim()||!productName.trim()||!dirty)return;
  setSaving(true);setError("");
  try{
   const res=await fetch("/api/admin/team-context",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,revision:data.context.revision,
     name,productName,vision:vision.trim()||null,productGoal:goal.trim()||null})
   });
   const result=await res.json() as Saved;
   if(!res.ok||!result.ok){
    const code="error" in result?result.error:"service-unavailable";
    setError(t(code==="conflict"?"teamUX.contextConflict":
     code==="invalid-input"?"teamUX.contextInvalid":
     "teamUX.contextSaveFailed"));return;
   }
   onSaved(result.context);
   setOpen(false);trigger.current?.focus();
   router.refresh();
  }catch{setError(t("teamUX.contextSaveFailed"));}
  finally{setSaving(false);}
 }
 return <>
  <button type="button" ref={trigger} className="btn btn-link btn-sm p-1"
   disabled={loading} aria-label={t("teamUX.contextEdit",{name:teamName})}
   title={t("teamUX.contextEdit",{name:teamName})}
   onClick={()=>void begin()}>
   <BootstrapIcon name="pencil-square"/>
  </button>
  {error&&!open&&<span role="alert" className="small text-danger">{error}</span>}
  {open&&data&&<dialog ref={dialog} className="smn-team-context-dialog"
   aria-labelledby="smn-team-context-title"
   onCancel={e=>{e.preventDefault();dismiss();}}>
   <div className="modal-content bg-body border rounded-4 shadow p-3 p-md-4">
    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
     <h2 className="h5 mb-0" id="smn-team-context-title">
      {t("teamUX.contextHeading")}
     </h2>
     <button type="button" className="btn-close" disabled={saving}
      aria-label={t("teamUX.cancel")} onClick={dismiss}/>
    </div>
    <form onSubmit={e=>void save(e)} className="d-grid gap-3"
     data-smn-unsaved-changes={dirty?"true":"false"}>
     <div>
      <label htmlFor="smn-team-edit-name" className="form-label">
       {t("teamUX.contextName")}
      </label>
      <input id="smn-team-edit-name" type="text" className="form-control"
       autoFocus required minLength={1} maxLength={120}
       value={name} disabled={saving} onChange={e=>setName(e.target.value)}/>
     </div>
     <div>
      <label htmlFor="smn-team-edit-product-name" className="form-label">
       {t("teamUX.contextProductName")}
      </label>
      <input id="smn-team-edit-product-name" type="text" className="form-control"
       required minLength={1} maxLength={120}
       value={productName} disabled={saving}
       onChange={e=>setProductName(e.target.value)}/>
     </div>
     <div>
      <label htmlFor="smn-team-edit-vision" className="form-label">
       {t("teamUX.contextVision")}
      </label>
      <textarea id="smn-team-edit-vision" className="form-control" rows={4}
       maxLength={5000} value={vision} disabled={saving}
       onChange={e=>setVision(e.target.value)}/>
     </div>
     <div>
      <label htmlFor="smn-team-edit-goal" className="form-label">
       {t("teamUX.contextProductGoal")}
      </label>
      <textarea id="smn-team-edit-goal" className="form-control" rows={4}
       maxLength={5000} value={goal} disabled={saving}
       onChange={e=>setGoal(e.target.value)}/>
     </div>
     <p className="small text-secondary mb-0">{t("teamUX.contextOptional")}</p>
     {data.history.length>0&&<details>
      <summary>{t("teamUX.contextHistory",{count:data.history.length})}</summary>
      <ol className="list-group list-group-numbered mt-2">
       {data.history.map(version=><li className="list-group-item" key={version.revision}>
        <strong>{t("teamUX.contextRevision",{revision:version.revision})}</strong>
        {" · "}{version.name}
        <div className="small text-secondary">
         <time dateTime={version.changedAt}>{version.changedAt}</time>
        </div>
        {version.productName&&<p className="small mt-2 mb-1">
         {t("teamUX.contextProductName")}: {version.productName}</p>}
        {version.vision&&<p className="small mt-2 mb-1" style={{whiteSpace:"pre-wrap"}}>
         {t("teamUX.contextVision")}: {version.vision}</p>}
        {version.productGoal&&<p className="small mb-0" style={{whiteSpace:"pre-wrap"}}>
         {t("teamUX.contextProductGoal")}: {version.productGoal}</p>}
       </li>)}
      </ol>
     </details>}
     {error&&<p role="alert" className="alert alert-warning mb-0">{error}</p>}
     <div className="d-flex justify-content-end gap-2">
      <button type="button" className="btn btn-outline-secondary"
       disabled={saving} onClick={dismiss}>{t("teamUX.cancel")}</button>
      <button type="submit" className="btn btn-primary"
       disabled={saving||!dirty||!name.trim()||!productName.trim()}>
       {t("teamUX.contextSave")}
      </button>
     </div>
    </form>
   </div>
  </dialog>}
 </>;
}
