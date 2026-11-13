"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import {createPortal} from "react-dom";
import {OPEN_ABSENCE_CATEGORY} from "./absence-category-create-button";
import {useTranslation} from "@/i18n/client";
import {filterSettingsAbsences} from "@/lib/settings-collection-filter";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";

type Category={id:string;name:string;color:string;isActive:boolean;
 updatedAt:string;usageCount:number};
type Draft={id:string|null;updatedAt:string|null;name:string;color:string;isActive:boolean};
const EMPTY:Draft={id:null,updatedAt:null,name:"",color:"#6B7280",isActive:true};
const isHex=(color:string)=>/^#[0-9a-fA-F]{6}$/u.test(color);
const errorKey:Record<string,"invalidInput"|"nameRequired"|"colorRequired"|
 "invalidName"|"invalidColor"|"duplicate"|"conflict"|"notFound"|"catalogueFull">={
 "invalid-input":"invalidInput","name-required":"nameRequired",
 "color-required":"colorRequired","invalid-name":"invalidName",
 "invalid-color":"invalidColor","duplicate-name":"duplicate",
 "conflict":"conflict","not-found":"notFound","catalogue-full":"catalogueFull"
};

export default function AbsenceCategoriesAdmin(){
 const t=useTranslation();
 const [categories,setCategories]=useState<Category[]>([]);
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [draft,setDraft]=useState<Draft>(EMPTY);
 const [editorOpen,setEditorOpen]=useState(false);
 const [mounted,setMounted]=useState(false);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const openerRef=useRef<HTMLElement|null>(null);
 const [baseline,setBaseline]=useState(JSON.stringify(EMPTY));
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [isError,setIsError]=useState(false);
 const [query,setQuery]=useState("");
 const [stateFilter,setStateFilter]=useState<"all"|"active"|"inactive">("all");
 const filtered=useMemo(()=>filterSettingsAbsences(categories,query,stateFilter),[categories,query,stateFilter]);
 const dirty=JSON.stringify(draft)!==baseline;
 useUnsavedChanges(editorOpen&&(dirty||busy),t("draft.leaveWarning"));
 const reload=useCallback(async()=>{
  const response=await fetch("/api/admin/absence-categories",{cache:"no-store"});
  if(!response.ok)throw Error("absence-categories-load");
  const body=await response.json() as {categories:Category[]};
  if(!Array.isArray(body.categories))throw Error("absence-categories-response");
  setCategories(body.categories);
  setStatus("ready");
 },[]);
 useEffect(()=>{
  let live=true;
  void fetch("/api/admin/absence-categories",{cache:"no-store"})
   .then(async response=>{
    if(!response.ok)throw Error("catalogue");
    return response.json() as Promise<{categories:Category[]}>;
   })
   .then(result=>{
    if(!live)return;
    if(!Array.isArray(result.categories))throw Error("catalogue");
    setCategories(result.categories);setStatus("ready");
   })
   .catch(()=>{if(live)setStatus("error");});
  return ()=>{live=false;};
 },[]);
 function adopt(next:Draft){
  setDraft(next);setBaseline(JSON.stringify(next));setNotice("");setIsError(false);
 }
 function edit(category:Category){
  if(busy)return;
  if(editorOpen&&dirty&&!window.confirm(t("draft.discardWarning")))return;
  openerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  adopt({id:category.id,updatedAt:category.updatedAt,name:category.name,
   color:category.color,isActive:category.isActive});
  setEditorOpen(true);
 }
 function newCategory(){
  if(busy||status!=="ready")return;
  if(editorOpen&&dirty&&!window.confirm(t("draft.discardWarning")))return;
  openerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  adopt(EMPTY);setEditorOpen(true);
 }
 function closeEditor(){
  if(busy)return;
  if(dirty&&!window.confirm(t("draft.discardWarning")))return;
  setEditorOpen(false);adopt(EMPTY);
 }
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{
  window.addEventListener(OPEN_ABSENCE_CATEGORY,newCategory);
  return()=>window.removeEventListener(OPEN_ABSENCE_CATEGORY,newCategory);
 });
 useEffect(()=>{
  if(!editorOpen)return;
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(!dialog.open)dialog.showModal();
  dialog.querySelector<HTMLInputElement>("#absence-category-name")?.focus();
  return()=>{if(dialog.open)dialog.close();openerRef.current?.focus();};
 },[editorOpen,mounted]);
 const update=<K extends keyof Draft>(key:K,value:Draft[K])=>
  setDraft(current=>({...current,[key]:value}));
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||status!=="ready")return;
  setBusy(true);setNotice("");setIsError(false);
  const isEditing=draft.id!==null;
  const body=isEditing?{
   action:"update",id:draft.id,updatedAt:draft.updatedAt,
   name:draft.name,color:draft.color,isActive:draft.isActive
  }:{action:"create",name:draft.name,color:draft.color};
  try{
   const response=await fetch("/api/admin/absence-categories",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
   });
   const result=await response.json() as {ok?:boolean;error?:string};
   if(!response.ok||!result.ok){
    setIsError(true);
    const key=errorKey[result.error??""]??"failed";
    setNotice(t(("absenceCategories."+key) as "absenceCategories.failed"));
    return;
   }
   await reload();
   adopt(EMPTY);setEditorOpen(false);
   setNotice(t(isEditing?"absenceCategories.saved":"absenceCategories.created"));
  }catch{setIsError(true);setNotice(t("absenceCategories.failed"));}
  finally{setBusy(false);}
 }
 const currentUse=categories.find(c=>c.id===draft.id);
 return <section className="smn-panel p-4 d-grid gap-4" aria-labelledby="absence-category-heading">
  <div>
   <h2 className="h5" id="absence-category-heading">{t("absenceCategories.title")}</h2>
   <p className="small text-secondary mb-0">{t("absenceCategories.description")}</p>
  </div>
  {status==="loading"&&<p role="status">{t("absenceCategories.loading")}</p>}
  {status==="error"&&<div className="alert alert-warning" role="alert">
   {t("absenceCategories.loadFailed")}
   <button className="btn btn-outline-secondary btn-sm ms-2" type="button"
    onClick={()=>{setStatus("loading");void reload().catch(()=>setStatus("error"));}}>
    {t("common.retry")}</button>
  </div>}
  {status==="ready"&&<>
   <div className="d-flex flex-wrap gap-3 align-items-end mb-1">
    <label className="form-label mb-0 flex-grow-1" style={{maxWidth:400,minWidth:180}}>{t("settingsCollections.searchAbsences")}
     <input type="search" className="form-control mt-1" value={query} onChange={event=>setQuery(event.target.value)}/>
    </label>
    <label className="form-label mb-0" style={{minWidth:170}}>{t("settingsCollections.filterStatus")}
     <select className="form-select mt-1" value={stateFilter} onChange={event=>setStateFilter(event.target.value as "all"|"active"|"inactive")}>
      <option value="all">{t("settingsCollections.all")}</option>
      <option value="active">{t("settingsCollections.active")}</option>
      <option value="inactive">{t("settingsCollections.inactive")}</option>
     </select>
    </label>
    <button type="button" className="btn btn-outline-secondary" onClick={()=>{setQuery("");setStateFilter("all");}} disabled={!query&&stateFilter==="all"}>{t("settingsCollections.reset")}</button>
   </div>
   <p role="status" aria-live="polite" className="small text-secondary mb-0">{t("settingsCollections.results",{count:filtered.length,total:categories.length})}</p>
   {filtered.length===0&&<p role="status" className="small text-secondary">{t("settingsCollections.noMatches")}</p>}
   <div className="table-responsive">
    <table className="table table-sm align-middle">
     <thead><tr>
      <th scope="col">{t("absenceCategories.name")}</th>
      <th scope="col">{t("absenceCategories.color")}</th>
      <th scope="col">{t("absenceCategories.state")}</th>
      <th scope="col">{t("absenceCategories.used")}</th>
      <th scope="col">{t("absenceCategories.actions")}</th>
     </tr></thead>
     <tbody>{filtered.map(category=><tr key={category.id}>
      <td><strong>{category.name}</strong></td>
      <td><span aria-hidden="true" className="d-inline-block rounded me-2"
       style={{width:"1.2rem",height:"1.2rem",verticalAlign:"middle",
        backgroundColor:category.color,border:"1px solid currentColor"}}/>
       <code>{category.color}</code></td>
      <td>{t(category.isActive?"absenceCategories.active":"absenceCategories.inactive")}</td>
      <td>{category.usageCount}</td>
      <td><button type="button" className="btn btn-sm btn-outline-primary"
       disabled={busy} onClick={()=>edit(category)}>
       {t("absenceCategories.edit")}
      </button></td>
     </tr>)}</tbody>
    </table>
   </div>
   {mounted&&editorOpen&&createPortal(<dialog ref={dialogRef} className="smn-absence-category-dialog"
    aria-labelledby="smn-absence-category-editor-title"
    onCancel={event=>{event.preventDefault();closeEditor();}}>
    <div className="smn-absence-category-modal">
     <header className="smn-absence-category-header">
      <div className="smn-absence-category-identity"><span className="smn-absence-category-symbol" aria-hidden="true">◈</span>
       <div><span className="smn-absence-category-eyebrow">COCKPIT AGILE</span>
        <h2 className="h5 mb-0" id="smn-absence-category-editor-title">{t(draft.id?"absenceCategories.editTitle":"absenceCategories.createTitle")}</h2>
       </div></div>
      <button type="button" className="btn-close" aria-label={t("absenceCategories.cancel")} disabled={busy} onClick={closeEditor}/>
     </header>
     <form id="smn-absence-category-form" className="smn-absence-category-form d-grid gap-3" onSubmit={submit}>
    <div>
     <label htmlFor="absence-category-name" className="form-label">
      {t("absenceCategories.name")}</label>
     <input id="absence-category-name" className="form-control" type="text"
      maxLength={100} required value={draft.name} disabled={busy}
      onChange={e=>update("name",e.target.value)}/>
    </div>
    <div className="d-flex flex-wrap gap-3 align-items-end">
     <div className="flex-grow-1">
      <label htmlFor="absence-category-color" className="form-label">
       {t("absenceCategories.color")}</label>
      <input id="absence-category-color" className="form-control" type="text"
       maxLength={7} minLength={7} pattern="#[a-fA-F0-9]{6}" required
       value={draft.color} disabled={busy}
       onChange={e=>update("color",e.target.value)}/>
     </div>
     <div>
      <label htmlFor="absence-category-picker" className="form-label">
       {t("absenceCategories.colorPicker")}</label>
      <input id="absence-category-picker" className="form-control form-control-color"
       type="color" value={isHex(draft.color)?draft.color:"#6B7280"}
       disabled={busy} onChange={e=>update("color",e.target.value.toUpperCase())}/>
     </div>
    </div>
    {draft.id&&<div>
     <label className="form-check-label">
      <input type="checkbox" className="form-check-input me-2"
       checked={draft.isActive} disabled={busy}
       onChange={e=>update("isActive",e.target.checked)}/>
      {t("absenceCategories.enabled")}</label>
     {currentUse&&currentUse.usageCount>0&&<p className="small text-secondary mt-1">
      {t("absenceCategories.usedHint",{count:currentUse.usageCount})}</p>}
    </div>}
    <p className="small text-secondary mb-0">{t("absenceCategories.noDelete")}</p>
    <p className="small text-secondary mb-0">{t("absenceCategories.medicalPrivacy")}</p>
     <footer className="smn-absence-category-footer d-flex flex-wrap justify-content-end gap-2">
      <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={closeEditor}>{t("absenceCategories.cancel")}</button>
      <button className="btn btn-primary" type="submit" disabled={busy}>{t(draft.id?"absenceCategories.save":"absenceCategories.create")}</button>
     </footer>
     </form>
    </div>
   </dialog>,document.body)}
  </>}
  {notice&&<p className={"alert "+(isError?"alert-warning":"alert-success")}
   role={isError?"alert":"status"}>{notice}</p>}
 </section>;
}
