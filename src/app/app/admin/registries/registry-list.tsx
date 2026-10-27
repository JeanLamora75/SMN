"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {registryTypes,registryStatuses,type RegistryType} from "@/lib/registry-types";
import type {RegistryScope,RegistryLifecycle,RegistrySort} from "@/server/registries/list";
import RegistryListRow,{type RegistryListItem} from "./registry-list-row";
import AttentionCockpit from "./attention-cockpit";
import {parseRegistryAttentionPayload,type RegistryAttentionEntry} from "@/lib/registry-attention-view";
import RegistryCard from "./registry-card";
import RegistryCreateModal from "./registry-create-modal";
import RegistryEditModal from "./registry-edit-modal";
import BootstrapIcon from "../../bootstrap-icon";
import {registryDetailHref} from "@/lib/registry-navigation";
import {parseRegistryDisplayView,registryDisplayPreferenceKey,type RegistryDisplayView} from "@/lib/registry-display-view";
import {parseRegistryIndexState,registryIndexUrl,registryScrollKey,type RegistryIndexState} from "@/lib/registry-navigation";

type Item=RegistryListItem;
type Page={state:"available";team:{id:string;name:string};items:Item[];total:number;page:number;totalPages:number}|
 {state:"unavailable";reason:string}|{state:"forbidden"};
type Cycle={id:string;name:string;status:string};
type CyclePage={state:"available";cycles:Cycle[]}|{state:"unavailable";reason:string};
type Filters={search:string;status:string;owner:string;lifecycle:RegistryLifecycle;sort:RegistrySort;cycleId:string};
const defaults:Filters={search:"",status:"",owner:"",lifecycle:"all",sort:"default",cycleId:""};
const sortValues:RegistrySort[]=["default","dateDesc","dateAsc","titleAsc","titleDesc"];
const categoryIcons={all:"stack",risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
 dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",highlight:"bell-fill"} as const;

export default function RegistryList({canManage,teamId,initialType="all",initialCreate=false,sourceId,initialCycleId,returnTo}:{
 canManage:boolean;teamId:string;initialType?:RegistryScope;initialCreate?:boolean;
 sourceId?:string;initialCycleId?:string;returnTo?:string;
}){
 const t=useTranslation();
 const [type,setType]=useState<RegistryScope>(initialType);
 const [createOpen,setCreateOpen]=useState(initialCreate&&canManage);
 const [createdId,setCreatedId]=useState<string|null>(null);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [view,setView]=useState<RegistryDisplayView>("list");
 const [mobileFiltersOpen,setMobileFiltersOpen]=useState(false);
 const [draft,setDraft]=useState<Filters>(defaults);
 const [query,setQuery]=useState<Filters>(defaults);
 const [page,setPage]=useState(1);
 const [result,setResult]=useState<Page|null>(null);
 const [error,setError]=useState(false),[loading,setLoading]=useState(true);
 const [refresh,setRefresh]=useState(0);
 const [restored,setRestored]=useState(false);
 const scrollRestored=useRef(false);
 const [cycles,setCycles]=useState<Cycle[]>([]);
 const [attention,setAttention]=useState<RegistryAttentionEntry[]|null>(null);
 const [attentionRefresh,setAttentionRefresh]=useState(0);
 const [attentionError,setAttentionError]=useState(false);
 const [attentionLoading,setAttentionLoading]=useState(true);
 const [cycleRefresh,setCycleRefresh]=useState(0);
 const [cycleError,setCycleError]=useState(false),[cyclesLoading,setCyclesLoading]=useState(true);
 const label=(value:string)=>t(("registryCreate."+value) as Parameters<typeof t>[0]);
 const translate=(value:string)=>t(("registryList."+value) as Parameters<typeof t>[0]);
 const patch=(next:Partial<Filters>)=>setDraft(old=>({...old,...next}));
 const apply=(next:Partial<Filters>)=>{
  if(Object.entries(next).every(([key,value])=>query[key as keyof Filters]===value)&&page===1)return;
  setDraft(old=>({...old,...next}));setQuery(old=>({...old,...next}));
  setPage(1);setLoading(true);scrollRestored.current=true;
 };
 useEffect(()=>{
  if(!restored)return;
  const timer=window.setTimeout(()=>{
   const search=draft.search.trim(),owner=canManage?draft.owner.trim():"";
   if(search!==query.search||owner!==query.owner){
    setQuery(old=>({...old,search,owner}));
    setPage(1);setLoading(true);scrollRestored.current=true;
   }
  },350);
  return()=>window.clearTimeout(timer);
 },[draft.search,draft.owner,query.search,query.owner,canManage,restored]);
 // URL is the source of truth for filters and pagination; local storage only chooses the default view.
 useEffect(()=>{
  const read=()=>{
   const state=parseRegistryIndexState(window.location.pathname+window.location.search);
   let preferred:RegistryDisplayView="list";
   try{preferred=parseRegistryDisplayView(window.localStorage.getItem(registryDisplayPreferenceKey));}
   catch{/* Browser storage may be unavailable. */}
   const explicitView=new URLSearchParams(window.location.search).has("view");
   const nextView=explicitView?state.view:preferred;
   setType(state.type);setDraft({
    search:state.search,status:state.status,owner:canManage?state.owner:"",
    lifecycle:state.lifecycle,sort:state.sort,cycleId:state.cycleId
   });
   setQuery({
    search:state.search,status:state.status,owner:canManage?state.owner:"",
    lifecycle:state.lifecycle,sort:state.sort,cycleId:state.cycleId
   });
   setPage(state.page);setView(nextView);setLoading(true);
  };
  let active=true;
  void Promise.resolve().then(()=>{if(active){read();setRestored(true);}});
  const onPop=()=>{scrollRestored.current=false;read();setRefresh(n=>n+1);};
  window.addEventListener("popstate",onPop);
  return()=>{active=false;window.removeEventListener("popstate",onPop);};
 },[canManage]);
 const origin=registryIndexUrl({
  type,...query,page,view,teamId
 } satisfies RegistryIndexState);
 useEffect(()=>{
  if(!restored||createOpen)return;
  const current=new URL(window.location.href);
  if(current.pathname!=="/app/admin/registries")return;
  if(current.pathname+current.search!==origin)
   window.history.replaceState(window.history.state,"",origin);
 },[origin,restored,createOpen]);
 const savePosition=()=>{
  try{window.sessionStorage.setItem(registryScrollKey(origin),String(window.scrollY));}
  catch{/* Restore position only when storage is available. */}
 };
 useEffect(()=>{
  if(!restored||loading||result?.state!=="available"||scrollRestored.current)return;
  scrollRestored.current=true;
  let y=0;
  try{y=Number(window.sessionStorage.getItem(registryScrollKey(origin))??"0");}
  catch{/* No stored position. */}
  if(!Number.isFinite(y)||y<0||y>10000000)return;
  const frame=window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>window.scrollTo(0,y)));
  return()=>window.cancelAnimationFrame(frame);
 },[restored,loading,result,origin]);
 const chooseView=(next:RegistryDisplayView)=>{
  setView(next);
  try{window.localStorage.setItem(registryDisplayPreferenceKey,next);}catch{/* Storage can be disabled. */}
 };
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/registries/attention?"+new URLSearchParams({teamId}),{cache:"no-store",signal:ctrl.signal})
   .then(async response=>{
    if(!response.ok)throw Error("attention-unavailable");
    const result=parseRegistryAttentionPayload(await response.json() as unknown);
    if(!result)throw Error("invalid-attention-payload");
    return result;
   })
   .then(result=>{
    if(ctrl.signal.aborted)return;
    setAttention(result.alerts);setAttentionError(false);
   })
   .catch(()=>{
    if(ctrl.signal.aborted)return;
    setAttention(null);setAttentionError(true);
   })
   .finally(()=>{if(!ctrl.signal.aborted)setAttentionLoading(false);});
  return()=>ctrl.abort();
 },[attentionRefresh,teamId]);
 const retryAttention=()=>{
  setAttention(null);setAttentionError(false);setAttentionLoading(true);
  setAttentionRefresh(n=>n+1);
 };
 const filtered=type!=="all"||query.search!==""||query.status!==""||
  query.owner!==""||query.cycleId!==""||query.lifecycle!=="all";
 const statuses=type==="all"
  ?Array.from(new Set(registryTypes.flatMap(kind=>[...registryStatuses[kind]])))
  :[...registryStatuses[type]];

 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/registries/cycles?"+new URLSearchParams({teamId}),{signal:ctrl.signal,cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<CyclePage>;})
   .then(data=>{
    if(ctrl.signal.aborted)return;
    if(data.state!=="available"){setCycleError(true);return;}
    setCycles(data.cycles);setCycleError(false);
   })
   .catch(()=>{if(!ctrl.signal.aborted)setCycleError(true);})
   .finally(()=>{if(!ctrl.signal.aborted)setCyclesLoading(false);});
  return()=>ctrl.abort();
 },[cycleRefresh,teamId]);

 useEffect(()=>{
  if(!restored)return;
  const ctrl=new AbortController();
  const params=new URLSearchParams({
   teamId,type,search:query.search,status:query.status,lifecycle:query.lifecycle,
   sort:query.sort,page:String(page)
  });
  if(query.cycleId)params.set("cycleId",query.cycleId);
  if(canManage&&query.owner)params.set("owner",query.owner);
  void fetch("/api/admin/registries?"+params.toString(),{signal:ctrl.signal,cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<Page>;})
   .then(data=>{if(!ctrl.signal.aborted){setResult(data);setError(false);setLoading(false);
    if(data.state==="available"&&data.page!==page)setPage(data.page);
   }})
   .catch(()=>{if(!ctrl.signal.aborted){setError(true);setLoading(false);}});
  return()=>ctrl.abort();
 },[type,query,page,canManage,refresh,restored,teamId]);

 const clearCreationQuery=()=>{
  const next=new URL(window.location.href);
  if(next.searchParams.get("create")==="1"){
   next.searchParams.delete("create");
   window.history.replaceState(window.history.state,"",next.pathname+next.search+next.hash);
  }
 };
 const created=(id:string)=>{
  clearCreationQuery();
  setCreateOpen(false);
  setCreatedId(id);
  setLoading(true);
  setRefresh(n=>n+1);
  setAttentionLoading(true);
  setAttentionRefresh(n=>n+1);
 };
 const createAnother=()=>{setCreatedId(null);setCreateOpen(true);};
 const edited=()=>{setEditingId(null);setLoading(true);setRefresh(n=>n+1);
  setAttentionLoading(true);setAttentionRefresh(n=>n+1);};
 const choose=(next:RegistryScope)=>{
  setType(next);setDraft(old=>({...old,status:""}));
  setQuery(old=>({...old,status:""}));setPage(1);setLoading(true);setRefresh(n=>n+1);
 };
 const reset=()=>{
  setDraft(defaults);setQuery(defaults);setPage(1);setLoading(true);setRefresh(n=>n+1);
 };
 return <section className="smn-registry-cockpit d-grid gap-3">
  <AttentionCockpit items={attention} error={attentionError}
   loading={attentionLoading} onRetry={retryAttention}/>
  <div className="smn-registry-hero">
  <header className="smn-registry-hero-top d-flex gap-3 align-items-center justify-content-between flex-wrap">
   <div className="smn-registry-hero-identity">
    <h1>{translate("heading")}</h1>
    <p className="smn-registry-hero-subtitle">{translate("subtitle")}</p>
    {!canManage&&<span className="smn-registry-readonly">{translate("readonly")}</span>}
   </div>
   <div className="d-flex flex-wrap align-items-center gap-2 ms-auto">
    <div className="btn-group smn-registry-view-switch" role="group" aria-label={translate("viewGroup")}>
     <button type="button" className={"btn btn-outline-secondary"+(view==="list"?" active":"")}
      aria-pressed={view==="list"} onClick={()=>chooseView("list")}>
      <BootstrapIcon name="list-ul"/><span>{translate("listView")}</span>
     </button>
     <button type="button" className={"btn btn-outline-secondary"+(view==="cards"?" active":"")}
      aria-pressed={view==="cards"} onClick={()=>chooseView("cards")}>
      <BootstrapIcon name="grid-3x3-gap"/><span>{translate("cardsView")}</span>
     </button>
    </div>
    {canManage&&<button type="button" className="btn btn-primary smn-registry-create"
     aria-label={translate("create")} onClick={()=>setCreateOpen(true)}>
     <span className="smn-registry-create-plus" aria-hidden="true">+</span><span className="smn-registry-create-label">{translate("create")}</span>
    </button>}
   </div>
  </header>
  {createdId&&<div className="alert alert-success d-flex flex-wrap gap-2 align-items-center"
   role="status">
   <span>{t("registryCreateModal.success")}</span>
   <Link className="btn btn-outline-success btn-sm"
    href={registryDetailHref(createdId,{origin,trail:[]})}>
    {t("registryCreateModal.viewRecord")}
   </Link>
   <button type="button" className="btn btn-outline-success btn-sm"
    onClick={createAnother}>{t("registryCreateModal.createAnother")}</button>
   {sourceId&&<Link className="btn btn-link btn-sm"
    href={"/app/admin/registries/"+encodeURIComponent(sourceId)}>
    {t("registryCreateModal.backToSource")}
   </Link>}
   {returnTo&&<Link className="btn btn-link btn-sm" href={returnTo}>
    {t("registryCreateModal.backToContext")}
   </Link>}
  </div>}
  <div className="nav nav-tabs flex-wrap d-none d-md-flex smn-registry-category-tabs" role="tablist" aria-label={translate("heading")}>
   {(["all",...registryTypes] as RegistryScope[]).map(kind=><button key={kind} type="button" role="tab" aria-selected={type===kind}
    data-registry-type={kind} className={"nav-link"+(type===kind?" active":"")} onClick={()=>choose(kind)}>
    <BootstrapIcon name={categoryIcons[kind]}/>
    <span>{kind==="all"?translate("allTypes"):label(kind)}</span>
   </button>)}
  </div>
  <div className="d-md-none smn-registry-type-mobile">
   <label className="form-label" htmlFor="reg-type-mobile">{translate("category")}</label>
   <select id="reg-type-mobile" className="form-select" value={type}
    onChange={e=>choose(e.target.value as RegistryScope)}>
    {(["all",...registryTypes] as RegistryScope[]).map(kind=><option key={kind} value={kind}>
     {kind==="all"?translate("allTypes"):label(kind)}</option>)}
   </select>
  </div>
  </div>
  <section className="smn-registry-filters-panel" aria-label={translate("filtersHeading")}>
   <div className="smn-registry-filters-heading">
    <h2><BootstrapIcon name="sliders"/>{translate("filtersHeading")}</h2>
    <div className="smn-registry-context">
     {!loading&&result?.state==="available"&&<span><BootstrapIcon name="people-fill"/>{translate("team")}: <strong>{result.team.name}</strong></span>}
     <span><BootstrapIcon name="grid-3x3-gap"/>{translate("viewLabel")}: <strong>{translate(view==="list"?"listView":"cardsView")}</strong></span>
     {!loading&&result?.state==="available"&&<span><BootstrapIcon name="list-ul"/>{t("registryList.summaryCount",{total:result.total})}</span>}
     {!attentionLoading&&!attentionError&&attention!==null&&<span><BootstrapIcon name="bell-fill"/>{t("registryAttention.count",{count:attention.length})}</span>}
    </div>
   </div>
   <button type="button" className="btn btn-outline-secondary smn-registry-mobile-filter-toggle d-md-none"
    aria-expanded={mobileFiltersOpen} aria-controls="smn-registry-filter-extras"
    onClick={()=>setMobileFiltersOpen(value=>!value)}>
    <BootstrapIcon name="sliders"/>{translate("filtersToggle")}
    <span className="smn-registry-filter-indicator">{[query.lifecycle!=="all",!!query.cycleId,!!query.status,query.sort!=="default",canManage&&!!query.owner].filter(Boolean).length||""}</span>
    <span aria-hidden="true">{mobileFiltersOpen?"▴":"▾"}</span>
   </button>
  <form className="row g-2 align-items-end" onSubmit={event=>{
   event.preventDefault();setPage(1);setLoading(true);setRefresh(n=>n+1);
   setQuery({...draft,search:draft.search.trim(),owner:canManage?draft.owner.trim():""});
  }}>
   <div className="col-md-5">
    <label className="form-label" htmlFor="reg-search">{translate("search")}</label>
    <input id="reg-search" className="form-control" maxLength={120} value={draft.search}
     onChange={e=>patch({search:e.target.value})}/>
   </div>
   <div id="smn-registry-filter-extras" className={"smn-registry-filter-extras"+(mobileFiltersOpen?" is-open":"")}>
   <div className="col-md-3">
    <label className="form-label" htmlFor="reg-lifecycle">{translate("lifecycle")}</label>
    <select id="reg-lifecycle" className="form-select" value={draft.lifecycle}
     onChange={e=>apply({lifecycle:e.target.value as RegistryLifecycle})}>
     <option value="all">{translate("allItems")}</option>
     <option value="followup">{translate("followup")}</option>
     <option value="final">{translate("final")}</option>
    </select>
   </div>
   <div className="col-md-4">
    <label className="form-label" htmlFor="reg-cycle">{translate("cycle")}</label>
    <select id="reg-cycle" className="form-select" value={draft.cycleId}
     disabled={cycleError||cyclesLoading} onChange={e=>apply({cycleId:e.target.value})}>
     <option value="">{translate("allCycles")}</option>
     {cycles.map(cycle=><option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
    </select>
    {cycleError&&<div role="alert" className="small text-danger">{translate("cycleUnavailable")}{" "}
     <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>{setCyclesLoading(true);setCycleError(false);setCycleRefresh(n=>n+1);}}>{translate("retry")}</button></div>}
   </div>
   <div className="col-md-3">
    <label className="form-label" htmlFor="reg-status">{translate("status")}</label>
    <select id="reg-status" className="form-select" value={draft.status}
     onChange={e=>apply({status:e.target.value})}>
     <option value="">{translate("allStatuses")}</option>
     {statuses.map(value=><option key={value} value={value}>{label(value)}</option>)}
    </select>
   </div>
   <div className="col-md-3">
    <label className="form-label" htmlFor="reg-sort">{translate("sort")}</label>
    <select id="reg-sort" className="form-select" value={draft.sort}
     onChange={e=>apply({sort:e.target.value as RegistrySort})}>
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
   </div>
  </form>
  </section>
  <section className="smn-registry-results">
  {query.lifecycle!=="all"&&<p className="small text-body-secondary mb-0">{translate("recordedUnclassified")}</p>}
  {loading?<div role="status" className="spinner-border spinner-border-sm" aria-label={translate("loading")}/>:
   error?<div role="alert" className="alert alert-danger">{translate("error")}{" "}
    <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>{setLoading(true);setRefresh(n=>n+1);}}>{translate("retry")}</button></div>:
   result?.state==="unavailable"?<div role="alert" className="alert alert-warning">{translate(result.reason==="links-not-installed"?"linksUnavailable":"unavailable")}{" "}
    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>{setLoading(true);setRefresh(n=>n+1);}}>{translate("retry")}</button></div>:
   result?.state!=="available"?<div role="alert" className="alert alert-warning">{translate("error")}</div>:
   <div className="d-grid gap-2">
    {result.items.length===0?<div role="status" className="alert alert-light border">
     {translate(filtered?"empty":"emptyInitial")}
     {filtered&&<button type="button" className="btn btn-outline-secondary btn-sm ms-2"
      onClick={reset}>{translate("reset")}</button>}
    </div>:
     view==="list"?<table className="table table-hover align-middle smn-registry-list-table">
      <thead><tr>
       <th scope="col">{translate("date")}</th>
       <th scope="col">{translate("category")}</th>
       <th scope="col">{translate("title")}</th>
       <th scope="col">{translate("status")}</th>
       {canManage&&<th scope="col">{translate("owner")}</th>}
       <th scope="col">{translate("due")}</th>
       <th scope="col">{translate("actions")}</th>
      </tr></thead>
      <tbody>{result.items.map(item=><RegistryListRow key={item.id} item={item}
       navigation={{origin,trail:[]}} onNavigate={savePosition} onEdit={()=>setEditingId(item.id)}
       canManage={canManage} highlight={createdId===item.id}
       signals={attention?.filter(signal=>signal.id===item.id)??[]}/>)}
      </tbody>
     </table>:<div className="smn-registry-card-grid" aria-label={translate("cardsView")}>
      {result.items.map(item=><RegistryCard key={item.id} item={item}
       navigation={{origin,trail:[]}} onNavigate={savePosition} onEdit={()=>setEditingId(item.id)}
       canManage={canManage} highlight={createdId===item.id}
       signals={attention?.filter(signal=>signal.id===item.id)??[]}/>)}
     </div>}
    <div className="d-flex align-items-center gap-3 flex-wrap">
     <button type="button" className="btn btn-outline-secondary btn-sm" disabled={result.page<=1}
      onClick={()=>{setPage(p=>p-1);setLoading(true);}}>{translate("previous")}</button>
     <span>{t("registryList.count",{total:result.total,page:result.page,pages:result.totalPages})}</span>
     <button type="button" className="btn btn-outline-secondary btn-sm" disabled={result.page>=result.totalPages}
      onClick={()=>{setPage(p=>p+1);setLoading(true);}}>{translate("next")}</button>
    </div>
   </div>}
  </section>
  {canManage&&createOpen&&<RegistryCreateModal
   teamId={teamId} initialType={type==="all"?"risk":type}
   sourceId={sourceId} cycleId={query.cycleId||initialCycleId}
   onCreated={created} onDismiss={()=>{clearCreationQuery();setCreateOpen(false);}}/>}
  {canManage&&editingId&&<RegistryEditModal id={editingId} teamId={teamId}
   onSaved={edited} onDismiss={()=>setEditingId(null)}/>} 
 </section>;
}
