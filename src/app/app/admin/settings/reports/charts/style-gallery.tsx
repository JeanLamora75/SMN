"use client";
import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {CHART_TYPES,type ChartType} from "@/server/reports/chart-style-contract";
import {filterGalleryStyles,usedAsDefault,canDeleteGalleryStyle,
 generateGalleryStyleId,validGalleryCatalog,type GalleryStyle,type GalleryCatalog} from "@/lib/chart-style-gallery";

type Style=GalleryStyle;
type Catalog=GalleryCatalog;
type SourceFilter="all"|"builtin"|"custom";
type ModalState={mode:"create"|"duplicate"|"rename";source:Style;name:string;description:string};
type ErrorPayload={error?:string};
const API="/api/admin/reports/chart-styles";
const types:readonly ChartType[]=CHART_TYPES;
function textError(error:unknown):string{
 return error instanceof Error?error.message:"service-unavailable";
}
export function StylePreview({style}:{style:Style}){
 const colors=style.config.common.palette;
 const grid=[28,16,37,24,48,33];
 return <svg className="smn-chart-preview" viewBox="0 0 320 140" role="img"
  aria-label={style.name} preserveAspectRatio="xMidYMid meet">
  <rect width="320" height="140" rx="10" fill={style.config.common.background}/>
  {[28,56,84,112].map(y=><line key={y} x1="28" x2="300" y1={y} y2={y}
   stroke="#d7e0e9" strokeWidth="1"/>)}
  <line x1="28" y1="12" x2="28" y2="116" stroke="#9aaabd" strokeWidth="1"/>
  {grid.map((v,i)=><rect key={i} x={43+i*41} y={116-v*1.7} width="23"
    height={v*1.7} rx={Math.min(4,style.config.types.bar.radius)}
    fill={colors[i%colors.length]}/>)}
  <g fill={style.config.common.textColor} fontSize="10" fontFamily={style.config.common.fontFamily}>
   <text x="40" y="132">S1</text><text x="122" y="132">S3</text><text x="205" y="132">S5</text>
  </g>
 </svg>;
}
export default function ChartStyleGallery({isAdmin}:{isAdmin:boolean}){
 const t=useTranslation();
 const [catalog,setCatalog]=useState<Catalog|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [query,setQuery]=useState("");
 const [origin,setOrigin]=useState<SourceFilter>("all");
 const [typeFilter,setTypeFilter]=useState<ChartType|"all">("all");
 const [modal,setModal]=useState<ModalState|null>(null);
 const [pendingDefault,setPendingDefault]=useState<{type:ChartType;styleId:string}|null>(null);
 const message=useCallback((code:string)=>{
  const mapping:Record<string,string>={
   "invalid-input":t("chartStyles.invalidInput"),"forbidden":t("chartStyles.forbidden"),
   "not-found":t("chartStyles.notFound"),"conflict":t("chartStyles.conflict"),
   "protected-style":t("chartStyles.protectedStyle"),"default-style":t("chartStyles.defaultStyle"),
   "schema-not-ready":t("chartStyles.schemaNotReady"),"service-unavailable":t("chartStyles.serviceUnavailable")
  };
  return mapping[code]??t("chartStyles.serviceUnavailable");
 },[t]);
 const reload=useCallback(async()=>{
  const response=await fetch(API,{cache:"no-store"});
  const value=await response.json().catch(()=>({})) as ErrorPayload;
  if(!response.ok)throw Error(value.error??"service-unavailable");
  if(!validGalleryCatalog(value))throw Error("service-unavailable");
  setCatalog(value);
 },[]);
 useEffect(()=>{
  let active=true;
  void (async()=>{
   try{
    const response=await fetch(API,{cache:"no-store"});
    const value=await response.json().catch(()=>({})) as ErrorPayload;
    if(!response.ok)throw Error(value.error??"service-unavailable");
    if(!validGalleryCatalog(value))throw Error("service-unavailable");
    if(active)setCatalog(value);
   }catch(cause){if(active)setError(textError(cause))}
   finally{if(active)setLoading(false)}
  })();
  return()=>{active=false};
 },[]);
 const dialogOpen=modal!==null||pendingDefault!==null;
 // Modal keyboard guard: Escape cancels; Tab remains within the active dialog.
 useEffect(()=>{
  if(!dialogOpen)return;
  const box=document.querySelector<HTMLElement>(".smn-chart-dialog");
  if(!box)return;
  const initial=box.querySelector<HTMLElement>("[autofocus],input,button:not([disabled])");
  initial?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"&&!busy){event.preventDefault();setModal(null);setPendingDefault(null);return;}
   if(event.key!=="Tab")return;
   const controls=Array.from(box.querySelectorAll<HTMLElement>(
    'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]'
   ));
   if(!controls.length){event.preventDefault();return;}
   const first=controls[0],last=controls[controls.length-1],current=document.activeElement;
   if(event.shiftKey&&current===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&current===last){event.preventDefault();first.focus();}
  };
  document.addEventListener("keydown",onKey);
  return()=>document.removeEventListener("keydown",onKey);
 },[dialogOpen,busy]);
 const shown=useMemo(()=>catalog?filterGalleryStyles(catalog,{query,origin,type:typeFilter}):[],
  [catalog,query,origin,typeFilter]);
 const defaults=useMemo(()=>catalog?.styles.filter(s=>s.source==="builtin")??[],[catalog]);
 async function perform(command:unknown,notice:string){
  if(busy)return;
  setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(command)});
   const data=await response.json().catch(()=>({})) as ErrorPayload;
   if(!response.ok)throw Error(data.error??"service-unavailable");
   await reload();
   setModal(null);setPendingDefault(null);setSuccess(notice);
  }catch(cause){setError(textError(cause))}
  finally{setBusy(false)}
 }
 function start(mode:ModalState["mode"],source:Style){
  setError("");setSuccess("");
  setModal({mode,source,name:mode==="rename"?source.name:source.name+" - "+t("chartStyles.gallery.copySuffix"),
   description:source.description});
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!modal||busy)return;
  const name=modal.name.trim();
  if(name.length<1||name.length>120)return setError("invalid-input");
  const description=modal.description.trim();
  if(description.length>500)return setError("invalid-input");
  if(modal.mode==="rename"){
   await perform({action:"update",id:modal.source.id,name,description,
    revision:modal.source.revision,config:modal.source.config},t("chartStyles.gallery.saved"));
  }else{
   await perform({action:"create",id:generateGalleryStyleId(name,crypto.randomUUID()),name,description,
    config:structuredClone(modal.source.config)},t("chartStyles.gallery.saved"));
  }
 }
 async function remove(style:Style){
  if(busy||!isAdmin)return;
  if(style.source==="builtin")return setError("protected-style");
  if(catalog&&!canDeleteGalleryStyle(catalog,style))return setError("default-style");
  if(!window.confirm(t("chartStyles.gallery.confirmDelete").replace("{name}",style.name)))return;
  await perform({action:"delete",id:style.id,revision:style.revision},t("chartStyles.gallery.deleted"));
 }
 async function applyDefault(){
  if(!pendingDefault||!catalog)return;
  await perform({action:"set-default",type:pendingDefault.type,styleId:pendingDefault.styleId,
   revision:catalog.defaults[pendingDefault.type].revision},t("chartStyles.gallery.saved"));
 }
 return <div className="smn-chart-gallery">
  {error&&<div className="alert alert-warning" role="alert">
   {message(error)} <button type="button" className="btn btn-sm btn-outline-secondary ms-2"
     onClick={()=>{setError("");void reload().catch(e=>setError(textError(e)))}}>{t("chartStyles.gallery.retry")}</button>
  </div>}
  {success&&<div className="alert alert-success" role="status">{success}</div>}
  {loading?<div className="smn-chart-skeleton" role="status" aria-label={t("chartStyles.gallery.loading")}>
   {[1,2,3].map(n=><div key={n} className="smn-chart-skeleton-item"/>)}
  </div>:catalog&&<>
   <section className="smn-chart-gallery-controls smn-panel p-3 p-lg-4 mb-4" aria-label={t("chartStyles.gallery.filters")}>
    <div className="smn-chart-filter-grid">
     <div><label className="form-label" htmlFor="style-search">{t("chartStyles.gallery.search")}</label>
      <input id="style-search" className="form-control" type="search" value={query}
       onChange={e=>setQuery(e.target.value)}/></div>
     <div><label className="form-label" htmlFor="style-origin">{t("chartStyles.gallery.origin")}</label>
      <select id="style-origin" className="form-select" value={origin}
       onChange={e=>setOrigin(e.target.value as SourceFilter)}>
       <option value="all">{t("chartStyles.gallery.all")}</option>
       <option value="builtin">{t("chartStyles.gallery.builtin")}</option>
       <option value="custom">{t("chartStyles.gallery.custom")}</option>
      </select></div>
     <div><label className="form-label" htmlFor="style-default-filter">{t("chartStyles.gallery.defaultType")}</label>
      <select id="style-default-filter" className="form-select" value={typeFilter}
       onChange={e=>setTypeFilter(e.target.value as ChartType|"all")}>
       <option value="all">{t("chartStyles.gallery.allTypes")}</option>
       {types.map(type=><option key={type} value={type}>{t(("chartStyles.gallery.types."+type) as "chartStyles.gallery.types.bar")}</option>)}
      </select></div>
     {isAdmin&&<div className="smn-chart-filter-action">
      <button type="button" className="btn btn-primary" onClick={()=>start("create",defaults[0]??catalog.styles[0])}
       disabled={busy||!catalog.styles.length}>{t("chartStyles.gallery.create")}</button>
     </div>}
    </div>
   </section>
   <section aria-labelledby="style-catalog-title">
    <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
     <h2 id="style-catalog-title" className="h5 mb-0">{t("chartStyles.gallery.catalog")}</h2>
     <span className="small text-secondary" role="status">{shown.length} / {catalog.styles.length}</span>
    </div>
    {shown.length?<div className="smn-chart-card-grid">
     {shown.map(style=>{
      const assigned=usedAsDefault(catalog,style.id);
      return <article className="smn-chart-style-card smn-panel" key={style.id}>
       <div className="smn-chart-style-preview"><StylePreview style={style}/></div>
       <div className="smn-chart-style-card-body">
        <div className="d-flex align-items-start justify-content-between gap-2">
         <div><h3 className="h5 mb-1">{style.name}</h3><p className="text-secondary small mb-1">{style.description}</p></div>
         <span className="smn-chart-source">{t(style.source==="builtin"?"chartStyles.gallery.builtin":"chartStyles.gallery.custom")}</span>
        </div>
        <div className="smn-chart-default-badges" aria-label={t("chartStyles.gallery.defaults")}>
         {assigned.length?assigned.map(type=><span className="badge text-bg-light" key={type}>
          {t(("chartStyles.gallery.types."+type) as "chartStyles.gallery.types.bar")}</span>):
          <span className="text-secondary small">{t("chartStyles.gallery.notDefault")}</span>}
        </div>
        <div className="smn-chart-actions">
         {isAdmin&&<button type="button" className="btn btn-sm btn-outline-primary" disabled={busy}
           onClick={()=>start("duplicate",style)}>{t("chartStyles.gallery.duplicate")}</button>}
         {isAdmin&&style.source==="custom"&&<>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy}
           onClick={()=>start("rename",style)}>{t("chartStyles.gallery.rename")}</button>
          <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy||assigned.length>0}
           title={assigned.length?t("chartStyles.defaultStyle"):undefined}
           onClick={()=>void remove(style)}>{t("chartStyles.gallery.delete")}</button>
         </>}
        </div>
       </div>
      </article>;
     })}
    </div>:<div className="smn-panel p-4 text-center" role="status">
     <p className="mb-2">{t("chartStyles.gallery.empty")}</p>
     <button type="button" className="btn btn-outline-secondary" onClick={()=>{setQuery("");setOrigin("all");setTypeFilter("all")}}>
      {t("chartStyles.gallery.reset")}</button>
    </div>}
   </section>
   <section className="smn-panel p-3 p-lg-4 mt-4" aria-labelledby="style-defaults-title">
    <h2 className="h5" id="style-defaults-title">{t("chartStyles.gallery.defaults")}</h2>
    <p className="text-secondary small">{t("chartStyles.gallery.defaultsInfo")}</p>
    <div className="smn-chart-default-grid">
     {types.map(type=><div key={type}>
      <label className="form-label" htmlFor={"default-"+type}>
       {t(("chartStyles.gallery.types."+type) as "chartStyles.gallery.types.bar")}</label>
      <select className="form-select" id={"default-"+type} value={catalog.defaults[type].styleId}
       disabled={!isAdmin||busy}
       onChange={e=>setPendingDefault({type,styleId:e.target.value})}>
       {catalog.styles.map(style=><option key={style.id} value={style.id}>{style.name}</option>)}
      </select>
     </div>)}
    </div>
   </section>
  </>}
  {modal&&<div className="smn-chart-dialog-backdrop" role="presentation">
   <div className="smn-chart-dialog smn-panel p-4" role="dialog" aria-modal="true"
    aria-labelledby="smn-style-dialog-title">
    <h2 className="h5" id="smn-style-dialog-title">{t(modal.mode==="rename"?"chartStyles.gallery.rename":"chartStyles.gallery.create")}</h2>
    <p className="small text-secondary">{t("chartStyles.gallery.basedOn")} {modal.source.name}</p>
    <form onSubmit={e=>void save(e)}>
     <label htmlFor="new-style-name" className="form-label">{t("chartStyles.gallery.name")}</label>
     <input id="new-style-name" autoFocus required maxLength={120} className="form-control mb-3"
      value={modal.name} onChange={e=>setModal({...modal,name:e.target.value})}/>
     <label htmlFor="new-style-description" className="form-label">{t("chartStyles.gallery.description")}</label>
     <textarea id="new-style-description" className="form-control mb-3" maxLength={500} rows={3}
      value={modal.description} onChange={e=>setModal({...modal,description:e.target.value})}/>
     <div className="d-flex justify-content-end gap-2">
      <button type="button" className="btn btn-outline-secondary" disabled={busy}
       onClick={()=>setModal(null)}>{t("chartStyles.gallery.cancel")}</button>
      <button type="submit" className="btn btn-primary" disabled={busy||!modal.name.trim()}>
       {busy?t("chartStyles.gallery.loading"):t("chartStyles.gallery.save")}</button>
     </div>
    </form>
   </div>
  </div>}
  {pendingDefault&&<div className="smn-chart-dialog-backdrop" role="presentation">
   <div role="dialog" aria-modal="true" aria-labelledby="smn-default-dialog-title" className="smn-chart-dialog smn-panel p-4">
    <h2 className="h5" id="smn-default-dialog-title">{t("chartStyles.gallery.confirmDefaultTitle")}</h2>
    <p>{t("chartStyles.gallery.confirmDefault").replace("{type}",
     t(("chartStyles.gallery.types."+pendingDefault.type) as "chartStyles.gallery.types.bar"))}</p>
    <div className="d-flex justify-content-end gap-2">
     <button type="button" className="btn btn-outline-secondary" disabled={busy}
      onClick={()=>setPendingDefault(null)}>{t("chartStyles.gallery.cancel")}</button>
     <button type="button" className="btn btn-primary" disabled={busy}
      onClick={()=>void applyDefault()}>{t("chartStyles.gallery.confirm")}</button>
    </div>
   </div>
  </div>}
 </div>;
}
