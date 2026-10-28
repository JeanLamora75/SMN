"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import LinkDialog from "../../links/link-dialog";
type Category={id:string;name:string;linkCount:number};
export default function CategoryAdmin(){
 const t=useTranslation();
 const [items,setItems]=useState<Category[]>([]);
 const [name,setName]=useState(""),[editing,setEditing]=useState<Category|null>(null),[deleting,setDeleting]=useState<Category|null>(null);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{const c=new AbortController();void fetch("/api/admin/links/categories/manage",{cache:"no-store",signal:c.signal})
 .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{items:Category[]}>;})
 .then(data=>{if(!c.signal.aborted)setItems(data.items);})
 .catch(()=>{if(!c.signal.aborted)setError(t("links.error"));});return()=>c.abort();},[refresh,t]);
 const submit=async()=>{
  if(busy||!name.trim())return;setBusy(true);setError("");
  try{const r=await fetch(editing?"/api/admin/links/categories/manage/"+encodeURIComponent(editing.id):"/api/admin/links/categories/manage",
   {method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});
   if(!r.ok)throw Error(String(r.status));setName("");setEditing(null);setRefresh(v=>v+1);
  }catch(e){setError(e instanceof Error&&e.message==="409"?t("linksAdmin.categoryDuplicate"):t("links.saveError"));}
  finally{setBusy(false);}
 };
 const remove=async()=>{
  if(!deleting||busy||deleting.linkCount>0)return;setBusy(true);setError("");
  try{const r=await fetch("/api/admin/links/categories/manage/"+encodeURIComponent(deleting.id),{method:"DELETE"});
   if(!r.ok)throw Error(String(r.status));setDeleting(null);setRefresh(v=>v+1);
  }catch(e){setError(e instanceof Error&&e.message==="409"?t("linksAdmin.categoryInUse"):t("links.saveError"));}
  finally{setBusy(false);}
 };
 return <section className="d-grid gap-3">
  <h2 className="h4">{t("linksAdmin.categories")}</h2>
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  <div className="d-flex gap-2 flex-wrap"><input className="form-control" style={{maxWidth:320}} maxLength={100} aria-label={t("linksAdmin.categoryName")} value={name} disabled={busy} onChange={e=>setName(e.target.value)}/><button type="button" className="btn btn-primary" disabled={busy||!name.trim()} onClick={()=>void submit()}>{editing?t("links.save"):t("linksAdmin.createCategory")}</button>{editing&&<button type="button" className="btn btn-outline-secondary" onClick={()=>{setEditing(null);setName("");}}>{t("links.cancel")}</button>}</div>
  <div className="list-group">{items.map(c=><div className="list-group-item d-flex gap-2 justify-content-between align-items-center flex-wrap" key={c.id}><div><strong>{c.name}</strong><span className="small text-body-secondary ms-2">{c.linkCount} {t("linksAdmin.usedBy")}</span></div><div className="d-flex gap-2"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>{setEditing(c);setName(c.name);}}>{t("links.edit")}</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>setDeleting(c)}>{t("links.delete")}</button></div></div>)}</div>
  {deleting&&<LinkDialog titleId="smn-category-delete-title" onClose={()=>setDeleting(null)} locked={busy}><div className="modal-header"><h3 className="modal-title fs-5" id="smn-category-delete-title">{t("links.confirmDelete")}: {deleting.name}</h3><button type="button" className="btn-close" aria-label={t("links.cancel")} disabled={busy} onClick={()=>setDeleting(null)}/></div><div className="modal-body">{deleting.linkCount>0?<p className="alert alert-warning" role="alert">{t("linksAdmin.categoryInUse")} ({deleting.linkCount})</p>:<p>{t("links.deleteWarning")}</p>}{error&&<p className="alert alert-danger" role="alert">{error}</p>}</div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>setDeleting(null)}>{t("links.cancel")}</button><button type="button" className="btn btn-danger" disabled={busy||deleting.linkCount>0} onClick={()=>void remove()}>{t("links.delete")}</button></div></LinkDialog>}
 </section>;
}
