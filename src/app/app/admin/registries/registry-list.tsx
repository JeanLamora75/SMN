"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {registryTypes,registryStatuses,type RegistryType} from "@/lib/registry-types";
type Item={id:string;type:RegistryType;title:string;status:string;occurredOn:string;dueOn:string|null;recordedAt:string;owner?:string|null};
type Page={state:"available";team:{id:string;name:string};items:Item[];total:number;page:number;totalPages:number}|
 {state:"unavailable";reason:string}|{state:"forbidden"};
export default function RegistryList({canManage}:{canManage:boolean}){
 const t=useTranslation();
 const [type,setType]=useState<RegistryType>("risk");
 const [search,setSearch]=useState("");const [status,setStatus]=useState("");
 const [owner,setOwner]=useState("");const [query,setQuery]=useState({search:"",status:"",owner:""});
 const [page,setPage]=useState(1);const [result,setResult]=useState<Page|null>(null);
 const [error,setError]=useState(false);const [loading,setLoading]=useState(true);
 useEffect(()=>{
  const ctrl=new AbortController();
  const params=new URLSearchParams({type,search:query.search,status:query.status,page:String(page)});
  if(canManage&&query.owner)params.set("owner",query.owner);
  void fetch("/api/admin/registries?"+params,{signal:ctrl.signal,cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Page>;})
   .then(data=>{if(!ctrl.signal.aborted){setResult(data);setError(false);setLoading(false);}})
   .catch(()=>{if(!ctrl.signal.aborted){setError(true);setLoading(false);}});
  return()=>ctrl.abort();
 },[type,query,page,canManage]);
 const label=(value:string)=>t(("registryCreate."+value) as Parameters<typeof t>[0]);
 const translate=(value:string)=>t(("registryList."+value) as Parameters<typeof t>[0]);
 const choose=(next:RegistryType)=>{setType(next);setStatus("");setQuery({search:"",status:"",owner:""});setSearch("");setOwner("");setPage(1);setLoading(true);};
 return <section className="d-grid gap-3">
  <header className="d-flex gap-3 align-items-center justify-content-between flex-wrap">
   <div><h1>{translate("heading")}</h1>{!canManage&&<span className="text-body-secondary">{translate("readonly")}</span>}</div>
   {canManage&&<Link className="btn btn-primary" href="/app/admin/registries/create">{translate("create")}</Link>}
  </header>
  <div className="nav nav-tabs flex-wrap" role="tablist" aria-label={translate("heading")}>
   {registryTypes.map(kind=><button key={kind} type="button" role="tab" aria-selected={type===kind}
    className={"nav-link"+(type===kind?" active":"")} onClick={()=>choose(kind)}>{label(kind)}</button>)}
  </div>
  <form className="row g-2 align-items-end" onSubmit={e=>{e.preventDefault();setPage(1);setLoading(true);setQuery({search:search.trim(),status,owner:canManage?owner.trim():""});}}>
   <div className="col-md-5"><label className="form-label" htmlFor="reg-search">{translate("search")}</label>
    <input id="reg-search" className="form-control" value={search} maxLength={120} onChange={e=>setSearch(e.target.value)}/></div>
   <div className="col-md-3"><label className="form-label" htmlFor="reg-status">{translate("status")}</label>
    <select id="reg-status" className="form-select" value={status} onChange={e=>setStatus(e.target.value)}>
     <option value="">{translate("allStatuses")}</option>
     {registryStatuses[type].map(s=><option key={s} value={s}>{label(s)}</option>)}
    </select></div>
   {canManage&&<div className="col-md-2"><label className="form-label" htmlFor="reg-owner">{translate("owner")}</label>
    <input id="reg-owner" className="form-control" value={owner} maxLength={200} onChange={e=>setOwner(e.target.value)}/></div>}
   <div className="col-md-2 d-flex gap-2"><button className="btn btn-outline-primary" type="submit">{translate("filter")}</button>
    <button className="btn btn-outline-secondary" type="button" onClick={()=>{setSearch("");setStatus("");setOwner("");setQuery({search:"",status:"",owner:""});setPage(1);}}>{translate("reset")}</button></div>
  </form>
  <p className="small text-body-secondary">{translate("cycleDeferred")}</p>
  {loading?<div role="status" className="spinner-border spinner-border-sm"/>:
   error?<div role="alert" className="alert alert-danger">{translate("error")}</div>:
   result?.state==="unavailable"?<div role="status" className="alert alert-warning">{translate("unavailable")}</div>:
   result?.state!=="available"?<div role="alert" className="alert alert-warning">{translate("error")}</div>:
   <div className="d-grid gap-2">
    <p className="small text-body-secondary">{translate("team")}: {result.team.name}</p>
    {result.items.length===0?<div role="status" className="alert alert-light border">{translate("empty")}</div>:
     <div className="table-responsive"><table className="table table-hover align-middle">
      <thead><tr><th scope="col">{translate("date")}</th><th scope="col">{translate("title")}</th><th scope="col">{translate("status")}</th>
       {canManage&&<th scope="col">{translate("owner")}</th>}<th scope="col">{translate("details")}</th></tr></thead>
      <tbody>{result.items.map(item=><tr key={item.id}>
       <td>{item.occurredOn}{type==="highlight"&&<div className="small text-body-secondary">{translate("manualType")} · {translate("recordedAt")}: {new Date(item.recordedAt).toLocaleString()}</div>}</td><td>{item.title}</td><td><span className="badge text-bg-secondary">{label(item.status)}</span></td>
       {canManage&&<td>{item.owner??"—"}</td>}
       <td><Link href={"/app/admin/registries/"+encodeURIComponent(item.id)}>{translate("details")}</Link></td>
      </tr>)}</tbody></table></div>}
    <div className="d-flex align-items-center gap-3 flex-wrap">
     <button type="button" className="btn btn-outline-secondary btn-sm" disabled={result.page<=1}
      onClick={()=>{setPage(p=>p-1);setLoading(true);}}>{translate("previous")}</button>
     <span>{t("registryList.count",{total:result.total,page:result.page,pages:result.totalPages})}</span>
     <button type="button" className="btn btn-outline-secondary btn-sm" disabled={result.page>=result.totalPages}
      onClick={()=>{setPage(p=>p+1);setLoading(true);}}>{translate("next")}</button>
    </div>
   </div>}
 </section>;
}
