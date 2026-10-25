"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {registryTypes,registryStatuses,type RegistryType} from "@/lib/registry-types";
import type {RegistryScope,RegistryLifecycle,RegistrySort} from "@/server/registries/list";

type Item={id:string;type:RegistryType;title:string;status:string;occurredOn:string;dueOn:string|null;recordedAt:string;owner?:string|null};
type Page={state:"available";team:{id:string;name:string};items:Item[];total:number;page:number;totalPages:number}|
 {state:"unavailable";reason:string}|{state:"forbidden"};
type Cycle={id:string;name:string;status:string};
type CyclePage={state:"available";cycles:Cycle[]}|{state:"unavailable";reason:string};
type Filters={search:string;status:string;owner:string;lifecycle:RegistryLifecycle;sort:RegistrySort;cycleId:string};
const defaults:Filters={search:"",status:"",owner:"",lifecycle:"all",sort:"default",cycleId:""};
const sortValues:RegistrySort[]=["default","dateDesc","dateAsc","titleAsc","titleDesc"];

export default function RegistryList({canManage,initialType="all"}:{
 canManage:boolean;initialType?:RegistryScope;
}){
 const t=useTranslation();
 const [type,setType]=useState<RegistryScope>(initialType);
 const [draft,setDraft]=useState<Filters>(defaults);
 const [query,setQuery]=useState<Filters>(defaults);
 const [page,setPage]=useState(1);
 const [result,setResult]=useState<Page|null>(null);
 const [error,setError]=useState(false),[loading,setLoading]=useState(true);
 const [refresh,setRefresh]=useState(0);
 const [cycles,setCycles]=useState<Cycle[]>([]);
 const [cycleRefresh,setCycleRefresh]=useState(0);
 const [cycleError,setCycleError]=useState(false),[cyclesLoading,setCyclesLoading]=useState(true);
 const label=(value:string)=>t(("registryCreate."+value) as Parameters<typeof t>[0]);
 const translate=(value:string)=>t(("registryList."+value) as Parameters<typeof t>[0]);
 const patch=(next:Partial<Filters>)=>setDraft(old=>({...old,...next}));
 const statuses=type==="all"
  ?Array.from(new Set(registryTypes.flatMap(kind=>[...registryStatuses[kind]])))
  :[...registryStatuses[type]];

 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/registries/cycles",{signal:ctrl.signal,cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<CyclePage>;})
   .then(data=>{
    if(ctrl.signal.aborted)return;
    if(data.state!=="available"){setCycleError(true);return;}
    setCycles(data.cycles);setCycleError(false);
   })
   .catch(()=>{if(!ctrl.signal.aborted)setCycleError(true);})
   .finally(()=>{if(!ctrl.signal.aborted)setCyclesLoading(false);});
  return()=>ctrl.abort();
 },[cycleRefresh]);

 useEffect(()=>{
  const ctrl=new AbortController();
  const params=new URLSearchParams({
   type,search:query.search,status:query.status,lifecycle:query.lifecycle,
   sort:query.sort,page:String(page)
  });
  if(query.cycleId)params.set("cycleId",query.cycleId);
  if(canManage&&query.owner)params.set("owner",query.owner);
  void fetch("/api/admin/registries?"+params.toString(),{signal:ctrl.signal,cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<Page>;})
   .then(data=>{if(!ctrl.signal.aborted){setResult(data);setError(false);setLoading(false);}})
   .catch(()=>{if(!ctrl.signal.aborted){setError(true);setLoading(false);}});
  return()=>ctrl.abort();
 },[type,query,page,canManage,refresh]);

 const choose=(next:RegistryScope)=>{
  setType(next);setDraft(old=>({...old,status:""}));
  setQuery(old=>({...old,status:""}));setPage(1);setLoading(true);
 };
 const reset=()=>{
  setDraft(defaults);setQuery(defaults);setPage(1);setLoading(true);
 };
 return <section className="d-grid gap-3">
  <header className="d-flex gap-3 align-items-center justify-content-between flex-wrap">
   <div><h1>{translate("heading")}</h1>{!canManage&&<span className="text-body-secondary">{translate("readonly")}</span>}</div>
   {canManage&&<Link className="btn btn-primary" href="/app/admin/registries/create">{translate("create")}</Link>}
  </header>
  <div className="nav nav-tabs flex-wrap d-none d-md-flex" role="tablist" aria-label={translate("heading")}>
   {(["all",...registryTypes] as RegistryScope[]).map(kind=><button key={kind} type="button" role="tab" aria-selected={type===kind}
    className={"nav-link"+(type===kind?" active":"")} onClick={()=>choose(kind)}>
    {kind==="all"?translate("allTypes"):label(kind)}</button>)}
  </div>
  <div className="d-md-none">
   <label className="form-label" htmlFor="reg-type-mobile">{translate("category")}</label>
   <select id="reg-type-mobile" className="form-select" value={type}
    onChange={e=>choose(e.target.value as RegistryScope)}>
    {(["all",...registryTypes] as RegistryScope[]).map(kind=><option key={kind} value={kind}>
     {kind==="all"?translate("allTypes"):label(kind)}</option>)}
   </select>
  </div>
  <form className="row g-2 align-items-end" onSubmit={event=>{
   event.preventDefault();setPage(1);setLoading(true);
   setQuery({...draft,search:draft.search.trim(),owner:canManage?draft.owner.trim():""});
  }}>
   <div className="col-md-5">
    <label className="form-label" htmlFor="reg-search">{translate("search")}</label>
    <input id="reg-search" className="form-control" maxLength={120} value={draft.search}
     onChange={e=>patch({search:e.target.value})}/>
   </div>
   <div className="col-md-3">
    <label className="form-label" htmlFor="reg-lifecycle">{translate("lifecycle")}</label>
    <select id="reg-lifecycle" className="form-select" value={draft.lifecycle}
     onChange={e=>patch({lifecycle:e.target.value as RegistryLifecycle})}>
     <option value="all">{translate("allItems")}</option>
     <option value="followup">{translate("followup")}</option>
     <option value="final">{translate("final")}</option>
    </select>
   </div>
   <div className="col-md-4">
    <label className="form-label" htmlFor="reg-cycle">{translate("cycle")}</label>
    <select id="reg-cycle" className="form-select" value={draft.cycleId}
     disabled={cycleError||cyclesLoading} onChange={e=>patch({cycleId:e.target.value})}>
     <option value="">{translate("allCycles")}</option>
     {cycles.map(cycle=><option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
    </select>
    {cycleError&&<div role="alert" className="small text-danger">{translate("cycleUnavailable")}{" "}
     <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>{setCyclesLoading(true);setCycleError(false);setCycleRefresh(n=>n+1);}}>{translate("retry")}</button></div>}
   </div>
   <div className="col-md-3">
    <label className="form-label" htmlFor="reg-status">{translate("status")}</label>
    <select id="reg-status" className="form-select" value={draft.status}
     onChange={e=>patch({status:e.target.value})}>
     <option value="">{translate("allStatuses")}</option>
     {statuses.map(value=><option key={value} value={value}>{label(value)}</option>)}
    </select>
   </div>
   <div className="col-md-3">
    <label className="form-label" htmlFor="reg-sort">{translate("sort")}</label>
    <select id="reg-sort" className="form-select" value={draft.sort}
     onChange={e=>patch({sort:e.target.value as RegistrySort})}>
     {sortValues.map(value=><option key={value} value={value}>{translate("sort"+value[0].toUpperCase()+value.slice(1))}</option>)}
    </select>
   </div>
   {canManage&&<div className="col-md-3">
    <label className="form-label" htmlFor="reg-owner">{translate("owner")}</label>
    <input id="reg-owner" className="form-control" maxLength={200} value={draft.owner}
     onChange={e=>patch({owner:e.target.value})}/>
   </div>}
   <div className="col-md-3 d-flex flex-wrap gap-2">
    <button className="btn btn-outline-primary" type="submit">{translate("filter")}</button>
    <button className="btn btn-outline-secondary" type="button" onClick={reset}>{translate("reset")}</button>
   </div>
  </form>
  {query.lifecycle!=="all"&&<p className="small text-body-secondary mb-0">{translate("recordedUnclassified")}</p>}
  {loading?<div role="status" className="spinner-border spinner-border-sm" aria-label={translate("loading")}/>:
   error?<div role="alert" className="alert alert-danger">{translate("error")}{" "}
    <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>{setLoading(true);setRefresh(n=>n+1);}}>{translate("retry")}</button></div>:
   result?.state==="unavailable"?<div role="alert" className="alert alert-warning">{translate(result.reason==="links-not-installed"?"linksUnavailable":"unavailable")}{" "}
    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>{setLoading(true);setRefresh(n=>n+1);}}>{translate("retry")}</button></div>:
   result?.state!=="available"?<div role="alert" className="alert alert-warning">{translate("error")}</div>:
   <div className="d-grid gap-2">
    <p className="small text-body-secondary">{translate("team")}: {result.team.name}</p>
    {result.items.length===0?<div role="status" className="alert alert-light border">{translate("empty")}</div>:
     <div className="table-responsive"><table className="table table-hover align-middle">
      <thead><tr><th scope="col">{translate("date")}</th><th scope="col">{translate("category")}</th>
       <th scope="col">{translate("title")}</th><th scope="col">{translate("status")}</th>
       {canManage&&<th scope="col">{translate("owner")}</th>}<th scope="col">{translate("details")}</th></tr></thead>
      <tbody>{result.items.map(item=><tr key={item.id}>
       <td>{item.occurredOn}{item.type==="highlight"&&<div className="small text-body-secondary">{translate("manualType")} · {translate("recordedAt")}: {new Date(item.recordedAt).toLocaleString()}</div>}</td>
       <td>{label(item.type)}</td><td>{item.title}</td>
       <td><span className="badge text-bg-secondary">{label(item.status)}</span></td>
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
