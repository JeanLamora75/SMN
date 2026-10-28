"use client";
import Link from "next/link";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type Closure={id:string;teamId:string;name:string;startOn:string;endOn:string;
 isActive:boolean;revision:number;createdAt:string;updatedAt:string};
type Catalog={team?:{id:string;name:string};closures:Closure[]};
type Company={id:string;name:string;archivedAt:string|null};
type Draft={id:string|null;revision:number;name:string;startOn:string;endOn:string;isActive:boolean};
const empty=():Draft=>({id:null,revision:0,name:"",startOn:"",endOn:"",isActive:true});
const errorKey:Record<string,string>={
 "invalid-input":"invalidInput","invalid-date":"invalidDate",
 "name-required":"nameRequired","team-not-found":"teamNotFound",
 "not-found":"notFound","conflict":"conflict","overlap":"overlap"
};
export default function CompanyClosuresAdmin(){
 const t=useTranslation();
 const [catalog,setCatalog]=useState<Catalog|null>(null);
 const [companyId,setCompanyId]=useState("");
 const [companies,setCompanies]=useState<Company[]>([]);
 const [companyMode,setCompanyMode]=useState(false);
 const [draft,setDraft]=useState<Draft>(empty);
 const [base,setBase]=useState(JSON.stringify(empty()));
 const [busy,setBusy]=useState(false);
 const [loadState,setLoadState]=useState<"loading"|"ready"|"error">("loading");
 const [message,setMessage]=useState("");
 const [isError,setIsError]=useState(false);
 const dirty=JSON.stringify(draft)!==base;
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 useEffect(()=>{
  let alive=true;
  void fetch("/api/admin/companies",{cache:"no-store"}).then(async r=>{
   if(!r.ok)throw Error("companies");
   return r.json() as Promise<{companies:Company[]}>;
  }).then(async response=>{
   if(!alive)return;
   const list=response.companies.filter(c=>!c.archivedAt);
   setCompanies(list);setCompanyMode(true);
   const first=list[0]?.id??"";
   setCompanyId(first);
   if(!first){setCatalog({closures:[]});setLoadState("ready");return;}
   const r=await fetch("/api/admin/companies/closures?companyId="+encodeURIComponent(first),{cache:"no-store"});
   if(!r.ok)throw Error("closures");
   const result=await r.json() as Catalog;
   if(!alive)return;
   setCatalog(result);setLoadState("ready");
  }).catch(()=>{
   if(!alive)return;
   void fetch("/api/admin/company-closures",{cache:"no-store"}).then(async r=>{
    if(!r.ok)throw Error("legacy");return r.json() as Promise<Catalog>;
   }).then(data=>{
    if(!alive)return;
    if(!data.team?.id||!Array.isArray(data.closures))throw Error("invalid");
    setCatalog(data);setLoadState("ready");
   }).catch(()=>{if(alive)setLoadState("error");});
  });return()=>{alive=false;};
 },[]);
 const reload=async(selected=companyId)=>{
  const url=companyMode?"/api/admin/companies/closures?companyId="+encodeURIComponent(selected):"/api/admin/company-closures";
  const response=await fetch(url,{cache:"no-store"});
  if(!response.ok)throw Error("load");
  const data=await response.json() as Catalog;
  if(!Array.isArray(data.closures))throw Error("invalid");
  if(!companyMode&&!data.team?.id)throw Error("invalid");
  setCatalog(data);setLoadState("ready");
 };
 const setEditor=(d:Draft)=>{setDraft(d);setBase(JSON.stringify(d));setMessage("");setIsError(false);};
 const open=(c:Closure)=>{
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  setEditor({id:c.id,revision:c.revision,name:c.name,startOn:c.startOn,
   endOn:c.endOn,isActive:c.isActive});
 };
 const newClosure=()=>{
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  setEditor(empty());
 };
 const update=<K extends keyof Draft>(key:K,value:Draft[K])=>
  setDraft(old=>({...old,[key]:value}));
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!catalog||busy)return;
  setBusy(true);setMessage("");setIsError(false);
  const isEdit=draft.id!==null;
  const payload=isEdit?{action:"update",id:draft.id,revision:draft.revision,
   ...(companyMode?{companyId}:{teamId:catalog.team!.id}),name:draft.name,startOn:draft.startOn,endOn:draft.endOn,
   isActive:draft.isActive}:{
   action:"create",...(companyMode?{companyId}:{teamId:catalog.team!.id}),name:draft.name,
   startOn:draft.startOn,endOn:draft.endOn
  };
  try{
   const response=await fetch(companyMode?"/api/admin/companies/closures":"/api/admin/company-closures",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
   });
   const result=await response.json() as {ok?:boolean;error?:string};
   if(!response.ok||!result.ok){
    setIsError(true);
    setMessage(t(("companyClosures."+ (errorKey[result.error??""]??"failed")) as "companyClosures.failed"));
    return;
   }
   await reload();
   setEditor(empty());
   setMessage(t(isEdit?"companyClosures.saved":"companyClosures.created"));
  }catch{setIsError(true);setMessage(t("companyClosures.failed"));}
  finally{setBusy(false);}
 }
 return <section className="smn-panel p-4 d-grid gap-3">
  <h2 className="h5">{t("companyClosures.title")}</h2>
  <p className="small text-secondary">{t("companyClosures.intro")}</p>
  {loadState==="loading"&&<p role="status">{t("companyClosures.loading")}</p>}
  {loadState==="error"&&<p className="alert alert-warning" role="alert">
   {t("companyClosures.loadFailed")}
   <button className="btn btn-outline-secondary btn-sm ms-2" onClick={()=>{
    setLoadState("loading");void reload().catch(()=>setLoadState("error"));
   }}>{t("common.retry")}</button>
  </p>}
  {catalog&&loadState==="ready"&&<>
   {companyMode?<div><label htmlFor="closure-company" className="form-label">Entreprise</label><select id="closure-company" className="form-select" value={companyId} onChange={e=>{setCompanyId(e.target.value);setEditor(empty());setLoadState("loading");void reload(e.target.value).catch(()=>setLoadState("error"));}}>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>:<h3 className="h6">{t("companyClosures.team",{team:catalog.team!.name})}</h3>}
   <div className="table-responsive">
    <table className="table table-sm">
     <thead><tr>
      <th scope="col">{t("companyClosures.name")}</th>
      <th scope="col">{t("companyClosures.from")}</th>
      <th scope="col">{t("companyClosures.to")}</th>
      <th scope="col">{t("companyClosures.status")}</th>
      <th scope="col">{t("companyClosures.actions")}</th>
     </tr></thead>
     <tbody>{catalog.closures.map(c=><tr key={c.id}>
      <td>{c.name}</td><td>{c.startOn}</td><td>{c.endOn}</td>
      <td>{t(c.isActive?"companyClosures.active":"companyClosures.cancelled")}</td>
      <td><button type="button" className="btn btn-sm btn-outline-primary"
       disabled={busy} onClick={()=>open(c)}>{t("companyClosures.edit")}</button></td>
     </tr>)}</tbody>
    </table>
   </div>
   {catalog.closures.length===0&&<p className="small">{t("companyClosures.none")}</p>}
   <form onSubmit={save} className="border-top pt-3 d-grid gap-3">
    <h3 className="h6">{t(draft.id?"companyClosures.editTitle":"companyClosures.newTitle")}</h3>
    <div><label htmlFor="company-closure-name" className="form-label">
     {t("companyClosures.name")}</label>
     <input id="company-closure-name" className="form-control" type="text"
      maxLength={120} required disabled={busy} value={draft.name}
      onChange={e=>update("name",e.target.value)}/></div>
    <div className="row g-2">
     <div className="col-md-6"><label htmlFor="company-closure-from" className="form-label">
      {t("companyClosures.from")}</label>
      <input id="company-closure-from" className="form-control" type="date"
       min="1900-01-01" max="2200-12-31" required disabled={busy}
       value={draft.startOn} onChange={e=>update("startOn",e.target.value)}/></div>
     <div className="col-md-6"><label htmlFor="company-closure-to" className="form-label">
      {t("companyClosures.to")}</label>
      <input id="company-closure-to" className="form-control" type="date"
       min="1900-01-01" max="2200-12-31" required disabled={busy}
       value={draft.endOn} onChange={e=>update("endOn",e.target.value)}/></div>
    </div>
    {draft.id&&<label className="form-check-label">
     <input className="form-check-input me-2" type="checkbox"
      checked={draft.isActive} disabled={busy}
      onChange={e=>update("isActive",e.target.checked)}/>
     {t("companyClosures.enabled")}</label>}
    <p className="small text-secondary">{t("companyClosures.auditHint")}</p>
    <div className="d-flex gap-2 flex-wrap">
     <button type="submit" className="btn btn-primary" disabled={busy||(companyMode&&!companyId)}>
      {t(draft.id?"companyClosures.save":"companyClosures.create")}</button>
     <button type="button" className="btn btn-outline-secondary" disabled={busy}
      onClick={newClosure}>{t("companyClosures.new")}</button>
     <Link className="btn btn-outline-secondary" href="/app/team-calendar">
      {t("companyClosures.openTeamCalendar")}</Link>
    </div>
   </form>
  </>}
  {message&&<p className={"alert "+(isError?"alert-warning":"alert-success")}
   role={isError?"alert":"status"}>{message}</p>}
 </section>;
}
