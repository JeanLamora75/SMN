"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Team={
 id:string;name:string;productName:string|null;vision:string|null;
 productGoal:string|null;revision:number;agileMode:"scrum"|"kanban"|null;modeLocked:boolean;isArchived:boolean;
};
type Values={name:string;agileMode:"scrum"|"kanban"|"";productName:string;vision:string;productGoal:string};
type Listing={items:Team[];canWrite:boolean};
type Response={ok?:boolean;changed?:boolean;teamId?:string;revision?:number;
 error?:string};
const blank:Values={name:"",agileMode:"",productName:"",vision:"",productGoal:""};
const valuesFrom=(team:Team):Values=>({
 name:team.name,agileMode:team.agileMode??"",productName:team.productName??"",vision:team.vision??"",
 productGoal:team.productGoal??""
});
const same=(a:Values,b:Values)=>a.name===b.name&&a.agileMode===b.agileMode&&a.productName===b.productName&&
 a.vision===b.vision&&a.productGoal===b.productGoal;

export default function TeamsSettings(){
 const t=useTranslation();
 const [items,setItems]=useState<Team[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [values,setValues]=useState<Values>(blank);
 const [canWrite,setCanWrite]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const current=items.find(team=>team.id===selected)??null;
 const initial=current?valuesFrom(current):blank;
 const dirty=!same(initial,values);
 const hasName=values.name.trim().length>0;
 const hasMode=values.agileMode==="scrum"||values.agileMode==="kanban";
 const requestList=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const res=await fetch("/api/admin/teams",{cache:"no-store"});
   if(!res.ok)throw Error("load");
   const data=await res.json() as Listing;
   if(!Array.isArray(data.items)||typeof data.canWrite!=="boolean")
    throw Error("shape");
   setItems(data.items);setCanWrite(data.canWrite);
   setSelected(previous=>data.items.some(item=>item.id===previous)?previous:null);
  }catch{
   setError(t("teamSettings.loadFailed"));
   setCanWrite(false);
  }finally{setLoading(false);}
 },[t]);
 useEffect(()=>{void Promise.resolve().then(()=>requestList());},[requestList]);
 useEffect(()=>{
  if(!dirty)return;
  const protect=(event:BeforeUnloadEvent)=>{
   event.preventDefault();event.returnValue="";
  };
  window.addEventListener("beforeunload",protect);
  return()=>window.removeEventListener("beforeunload",protect);
 },[dirty]);

 function changeTeam(next:string|null){
  if(saving)return;
  if(dirty&&!window.confirm(t("teamSettings.confirmDiscard")))return;
  const team=items.find(item=>item.id===next)??null;
  setSelected(team?.id??null);setValues(team?valuesFrom(team):blank);
  setError("");setNotice("");
 }
 function setField(key:keyof Values,value:string){
  setValues(old=>({...old,[key]:value}));setError("");setNotice("");
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(saving||loading||!canWrite||!hasName||!hasMode||!dirty&&current)return;
  setSaving(true);setError("");setNotice("");
  const body={
   ...(current?{teamId:current.id,revision:current.revision}:{}),
   name:values.name,
   agileMode:values.agileMode,
   productName:values.productName.trim()||null,
   vision:values.vision.trim()||null,
   productGoal:values.productGoal.trim()||null
  };
  try{
   const res=await fetch("/api/admin/teams",{
    method:current?"PATCH":"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
   });
   const result=await res.json() as Response;
   if(!res.ok||result.ok!==true){
    const code=result.error;
    setError(t(code==="duplicate-name"?"teamSettings.duplicate":
     code==="conflict"?"teamSettings.conflict":
     code==="mode-locked"?"teamSettings.modeConflict":
     code==="invalid-input"?"teamSettings.invalid":
     code==="forbidden"?"teamSettings.denied":
     code==="schema-not-ready"?"teamSettings.unavailable":
     "teamSettings.saveFailed"));
    return;
   }
   // Rafraîchir la liste, sans modifier l'équipe active dans le shell.
   setSelected(null);setValues(blank);
   setNotice(t(current?"teamSettings.saved":"teamSettings.created"));
   await requestList();
  }catch{
   setError(t("teamSettings.saveFailed"));
  }finally{setSaving(false);}
 }
 return <div className="row g-4">
  <section className="col-12 col-xl-4" aria-labelledby="smn-teams-list-title">
   <div className="smn-panel rounded-4 p-3 p-md-4">
    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
     <h2 className="h5 mb-0" id="smn-teams-list-title">{t("teamSettings.title")}</h2>
     <button type="button" className="btn btn-sm btn-outline-secondary"
      onClick={()=>void requestList()} disabled={saving||loading}>
      {t("teamSettings.retry")}
     </button>
    </div>
    <button type="button" className={"btn w-100 mb-3 "+(!selected?"btn-primary":"btn-outline-primary")}
     onClick={()=>changeTeam(null)} disabled={saving||loading}>
     {t("teamSettings.newTeam")}
    </button>
    {loading?<p role="status">{t("teamSettings.loading")}</p>:
     items.length===0?<p className="text-secondary">{t("teamSettings.noTeams")}</p>:
     <ul className="list-group" aria-label={t("teamSettings.select")}>
      {items.map(item=><li className="list-group-item p-0" key={item.id}>
       <button type="button" className={"btn w-100 text-start rounded-0 py-3 "+
        (selected===item.id?"fw-semibold bg-body-tertiary":"")}
        aria-current={selected===item.id?"true":undefined}
        disabled={saving} onClick={()=>changeTeam(item.id)}>
        <span className="d-block">{item.name} {item.agileMode&&<span className="badge bg-secondary ms-1">{item.agileMode==="scrum"?"Scrum":"Kanban"}</span>}</span>
        <span className="small text-secondary">{item.productName??t("teamSettings.noProduct")}</span>
       </button>
      </li>)}
     </ul>}
   </div>
  </section>
  <section className="col-12 col-xl-8" aria-labelledby="smn-teams-form-title">
   <div className="smn-panel rounded-4 p-3 p-md-4">
    <h2 className="h5 mb-2" id="smn-teams-form-title">
     {t(current?"teamSettings.editTeam":"teamSettings.newTeam")}
    </h2>
    <p className="text-secondary small">{t("teamSettings.description")}</p>
    {!canWrite&&!loading&&<p className="alert alert-info" role="status">
     {t("teamSettings.unavailable")}
    </p>}
    {notice&&<p className="alert alert-success" role="status">{notice}</p>}
    {error&&<p className="alert alert-warning" role="alert">{error}</p>}
    <form className="d-grid gap-3" data-smn-unsaved-changes={dirty?"true":"false"}
     onSubmit={event=>void submit(event)}>
     <div>
      <label htmlFor="smn-team-settings-name" className="form-label">
       {t("teamSettings.teamName")} <span className="text-danger" aria-hidden="true">*</span>
      </label>
      <input id="smn-team-settings-name" className="form-control" type="text"
       required maxLength={120} autoComplete="off" value={values.name}
       aria-required="true" disabled={!canWrite||saving||loading}
       onChange={event=>setField("name",event.target.value)}/>
     </div>
     <fieldset aria-describedby="smn-agile-help" disabled={!canWrite||saving||loading||current?.modeLocked===true}>
      <legend className="form-label fs-6 fw-semibold">{t("teamSettings.agileMode")} <span className="text-danger" aria-hidden="true">*</span></legend>
      <p id="smn-agile-help" className="small text-secondary">{t("teamSettings.modeHelp")}</p>
      {current?.modeLocked?<p className="small text-secondary mb-2">{t("teamSettings.modeLocked")}</p>:null}
      {(["scrum","kanban"] as const).map(mode=><div className="form-check" key={mode}>
       <input className="form-check-input" type="radio" id={"smn-mode-"+mode} name="agileMode"
        value={mode} checked={values.agileMode===mode} required={!current?.modeLocked}
        onChange={()=>setField("agileMode",mode)}/>
       <label className="form-check-label" htmlFor={"smn-mode-"+mode}>{mode==="scrum"?"Scrum":"Kanban"}</label>
      </div>)}
     </fieldset>
     <div>
      <label htmlFor="smn-team-settings-product" className="form-label">
       {t("teamSettings.productName")} <span className="text-secondary small">({t("teamSettings.optional")})</span>
      </label>
      <input id="smn-team-settings-product" className="form-control" type="text"
       maxLength={120} value={values.productName}
       disabled={!canWrite||saving||loading}
       onChange={event=>setField("productName",event.target.value)}/>
     </div>
     <div>
      <label htmlFor="smn-team-settings-vision" className="form-label">
       {t("teamSettings.vision")} <span className="text-secondary small">({t("teamSettings.optional")})</span>
      </label>
      <textarea id="smn-team-settings-vision" className="form-control" rows={4}
       maxLength={5000} value={values.vision} disabled={!canWrite||saving||loading}
       onChange={event=>setField("vision",event.target.value)}/>
     </div>
     <div>
      <label htmlFor="smn-team-settings-goal" className="form-label">
       {t("teamSettings.productGoal")} <span className="text-secondary small">({t("teamSettings.optional")})</span>
      </label>
      <textarea id="smn-team-settings-goal" className="form-control" rows={4}
       maxLength={5000} value={values.productGoal} disabled={!canWrite||saving||loading}
       onChange={event=>setField("productGoal",event.target.value)}/>
     </div>
     <div className="d-flex flex-wrap gap-2 justify-content-end">
      <button type="button" className="btn btn-outline-secondary"
       onClick={()=>changeTeam(null)} disabled={saving||loading}>
       {t("teamSettings.cancel")}
      </button>
      <button type="submit" className="btn btn-primary"
       disabled={!canWrite||loading||saving||!hasName||!hasMode||current!==null&&!dirty}>
       {t(current?"teamSettings.save":"teamSettings.create")}
      </button>
     </div>
    </form>
   </div>
  </section>
 </div>;
}
