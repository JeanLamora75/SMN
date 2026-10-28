"use client";
import {useEffect,useMemo,useState} from "react";
import {useTranslation} from "@/i18n/client";
import BootstrapIcon from "../../bootstrap-icon";
import {filterLinks,type LinkEntry} from "@/lib/links-display";
import LinkEditor from "./link-editor";
import LinkDialog from "./link-dialog";
type Item=LinkEntry;
type View="cards"|"list";
const key="smn-links-display-view";
export default function LinksCockpit({teamId,teamName}:{teamId:string;teamName:string}){
 const t=useTranslation();
 const [items,setItems]=useState<Item[]>([]);
 const [categories,setCategories]=useState<{id:string;name:string}[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [search,setSearch]=useState("");
 const [scope,setScope]=useState("all");
 const [category,setCategory]=useState("all");
 const [sort,setSort]=useState("title");
 const [view,setView]=useState<View>("cards");
 const [reload,setReload]=useState(0);
 const [editing,setEditing]=useState<{open:true;item:Item|null}|null>(null);
 const [deleting,setDeleting]=useState<Item|null>(null);
 const [mutationError,setMutationError]=useState("");
 const [busy,setBusy]=useState(false);
 const changed=()=>{setEditing(null);setDeleting(null);setLoading(true);setReload(n=>n+1);};
 const remove=async()=>{
  if(!deleting||busy)return;
  setBusy(true);setMutationError("");
  try{
   const response=await fetch("/api/admin/links/"+encodeURIComponent(deleting.id),{
    method:"DELETE",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({revision:deleting.revision})
   });
   if(!response.ok)throw Error(String(response.status));
   changed();
  }catch(e){
   const status=e instanceof Error?e.message:"";
   setMutationError(status==="409"?t("links.conflict"):
    status==="404"?t("links.notFound"):
    status==="403"?t("links.forbidden"):t("links.saveError"));
  }finally{setBusy(false);}
 };
 useEffect(()=>{try{const preferred=localStorage.getItem(key);if(preferred==="list")queueMicrotask(()=>setView("list"));}catch{}},[]);
 useEffect(()=>{
  const controller=new AbortController();
  const options={signal:controller.signal,cache:"no-store" as const};
  void Promise.all([
   fetch("/api/admin/links?"+new URLSearchParams({teamId}),options),
   fetch("/api/admin/links/categories",options)
  ]).then(async ([links,cats])=>{
    if(!links.ok||!cats.ok)throw Error("unavailable");
    return Promise.all([links.json() as Promise<{items:Item[]}>,cats.json() as Promise<{items:{id:string;name:string}[]}>]);
   }).then(([links,cats])=>{if(controller.signal.aborted)return;
    if(!Array.isArray(links.items)||!Array.isArray(cats.items))throw Error("invalid-response");
    setItems(links.items);setCategories(cats.items);setError(false);
   }).catch(()=>{if(!controller.signal.aborted){setItems([]);setCategories([]);setError(true);}})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[teamId,reload]);
 const shown=useMemo(()=>{
  return filterLinks(items,{search,scope,category,sort});
 },[items,search,scope,category,sort]);
 const selectView=(next:View)=>{setView(next);try{localStorage.setItem(key,next);}catch{}};
 const reset=()=>{setSearch("");setScope("all");setCategory("all");setSort("title");};
 const action=(item:Item)=><div className="d-flex flex-wrap align-items-center gap-2">
  <a className="btn btn-sm btn-outline-primary" href={item.url} target="_blank" rel="noopener noreferrer">{t("links.open")}</a>
  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>setEditing({open:true,item})} aria-label={t("links.edit")+" : "+item.title}><BootstrapIcon name="pencil-square"/></button>
  <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>{setMutationError("");setDeleting(item);}} aria-label={t("links.delete")+" : "+item.title}>{t("links.delete")}</button>
 </div>;
 return <section className="smn-links-cockpit d-grid gap-3">
  <header className="smn-links-hero">
   <div className="smn-links-hero-top">
    <div className="smn-links-identity">
     <h1><BootstrapIcon name="link-45deg"/> {t("links.title")}</h1>
     <p><BootstrapIcon name="people-fill"/> {t("links.team")} : {teamName}</p>
    </div>
    <button type="button" className="btn smn-links-create" onClick={()=>setEditing({open:true,item:null})}>
     <BootstrapIcon name="plus-lg"/> {t("links.add")}
    </button>
   </div>
   <div className="smn-links-view-switch" role="group" aria-label={t("links.view")}>
    <button type="button" aria-pressed={view==="cards"} onClick={()=>selectView("cards")}>
     <BootstrapIcon name="grid-3x3-gap"/> {t("links.cards")}
    </button>
    <button type="button" aria-pressed={view==="list"} onClick={()=>selectView("list")}>
     <BootstrapIcon name="list-ul"/> {t("links.list")}
    </button>
   </div>
  </header>
  <div className="smn-links-filters">
   <div className="smn-links-filters-heading">
    <h2><BootstrapIcon name="funnel"/> {t("links.search")}</h2>
    <span className="smn-links-count" role="status" aria-live="polite">{shown.length} / {items.length}</span>
   </div>
   <div className="smn-links-filters-grid">
    <label className="smn-links-search">
     <span className="visually-hidden">{t("links.search")}</span>
     <BootstrapIcon name="search"/>
     <input id="smn-links-search" type="search" className="form-control"
      value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("links.search")}/>
    </label>
    <select className="form-select" aria-label={t("links.scope")} value={scope} onChange={e=>setScope(e.target.value)}>
     <option value="all">{t("links.allScopes")}</option><option value="TRANSVERSE">{t("links.transverse")}</option><option value="EQUIPE">{t("links.specific")}</option>
    </select>
    <select className="form-select" aria-label={t("links.category")} value={category} onChange={e=>setCategory(e.target.value)}>
     <option value="all">{t("links.allCategories")}</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
    <select className="form-select" aria-label={t("links.sort")} value={sort} onChange={e=>setSort(e.target.value)}>
     <option value="title">{t("links.sortTitle")}</option><option value="category">{t("links.sortCategory")}</option><option value="recent">{t("links.sortRecent")}</option>
    </select>
   </div>
  </div>
  <div className="smn-links-results">
   {loading?<div className="smn-links-state" role="status"><BootstrapIcon name="hourglass-split"/> {t("links.loading")}</div>:error?
    <div className="smn-links-state smn-links-state-error" role="alert">
     <BootstrapIcon name="exclamation-triangle"/> {t("links.error")}
     <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>{setLoading(true);setReload(x=>x+1);}}>{t("links.retry")}</button>
    </div>:shown.length===0?
    <div className="smn-links-state" role="status">
     <BootstrapIcon name="link-45deg"/>
     <span>{items.length===0?t("links.empty"):t("links.noMatch")}</span>
     {items.length>0&&<button type="button" className="btn btn-outline-primary btn-sm" onClick={reset}>{t("links.reset")}</button>}
    </div>:view==="cards"?
    <div className="smn-links-grid">{shown.map(item=>
     <article key={item.id} className="smn-links-item">
      <div className="smn-links-item-body">
       <h2>{item.title}</h2>
       <div className="smn-links-meta"><BootstrapIcon name="tag"/> {item.categoryName} <span aria-hidden="true">·</span> {item.scope==="TRANSVERSE"?t("links.transverse"):t("links.specific")}</div>
       {item.description&&<p className="smn-links-description">{item.description}</p>}
      </div>
      <div className="smn-links-actions">{action(item)}</div>
     </article>)}</div>:
    <div className="smn-links-list">{shown.map(item=>
     <article key={item.id} className="smn-links-item smn-links-item-row">
      <div className="smn-links-item-body">
       <h2>{item.title}</h2>
       <div className="smn-links-meta"><BootstrapIcon name="tag"/> {item.categoryName} <span aria-hidden="true">·</span> {item.scope==="TRANSVERSE"?t("links.transverse"):t("links.specific")}</div>
       {item.description&&<p className="smn-links-description">{item.description}</p>}
      </div>
      <div className="smn-links-actions">{action(item)}</div>
     </article>)}</div>}
  </div>
  {editing&&<LinkEditor teamId={teamId} categories={categories} item={editing.item} onClose={()=>setEditing(null)} onSaved={changed}/>}
  {deleting&&<LinkDialog titleId="smn-links-delete-title" onClose={()=>setDeleting(null)} locked={busy}><div className="modal-header"><h2 id="smn-links-delete-title" className="modal-title fs-5">{t("links.confirmDelete")}</h2></div><div className="modal-body"><p>{deleting.title}</p><p className="text-body-secondary">{t("links.deleteWarning")}</p>{mutationError&&<div className="alert alert-danger" role="alert">{mutationError}</div>}</div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>setDeleting(null)}>{t("links.cancel")}</button><button type="button" className="btn btn-danger" disabled={busy} onClick={()=>void remove()}>{t("links.delete")}</button></div></LinkDialog>}
 </section>;
}
