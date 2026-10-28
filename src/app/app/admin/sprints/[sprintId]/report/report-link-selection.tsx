"use client";
import {useEffect,useMemo,useState} from "react";
import {useTranslation} from "@/i18n/client";
type LinkItem={id:string;title:string;url:string;categoryName:string;scope:"TRANSVERSE"|"EQUIPE"};
export default function ReportLinkSelection({sprintId}:{sprintId:string}){
 const t=useTranslation();
 const [items,setItems]=useState<LinkItem[]>([]),[selected,setSelected]=useState<string[]>([]);
 const [query,setQuery]=useState(""),[error,setError]=useState(false),[loading,setLoading]=useState(true);
 const [revision,setRevision]=useState<number|null>(null),[baseline,setBaseline]=useState("[]"),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState(""),[saved,setSaved]=useState(false);
 useEffect(()=>{const controller=new AbortController();
  const root="/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/links";
  void Promise.all([fetch(root,{cache:"no-store",signal:controller.signal}),fetch(root+"/selection",{cache:"no-store",signal:controller.signal})])
   .then(async ([links,selection])=>{if(!links.ok||!selection.ok)throw Error();return Promise.all([links.json() as Promise<{items:LinkItem[]}>,selection.json() as Promise<{ids:string[];revision:number}>]);})
   .then(([data,selection])=>{if(!controller.signal.aborted){if(!Array.isArray(data.items)||!Array.isArray(selection.ids))throw Error();setItems(data.items);const ids=selection.ids.filter(id=>data.items.some(x=>x.id===id));setSelected(ids);setBaseline(JSON.stringify(ids));setRevision(selection.revision);setError(false);}})
   .catch(()=>{if(!controller.signal.aborted)setError(true);})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[sprintId]);
 const filtered=useMemo(()=>items.filter(item=>(item.title+" "+item.categoryName).toLocaleLowerCase().includes(query.toLocaleLowerCase())),[items,query]);
 const dirty=revision!==null&&JSON.stringify(selected)!==baseline;
 const save=async()=>{if(!dirty||saving||revision===null)return;setSaving(true);setSaveError("");setSaved(false);try{const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/links/selection",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:selected,revision})});if(!r.ok)throw Error(String(r.status));const next=await r.json() as {revision:number};setRevision(next.revision);setBaseline(JSON.stringify(selected));setSaved(true);}catch(e){setSaveError(e instanceof Error&&e.message==="409"?t("links.conflict"):t("links.saveError"));}finally{setSaving(false);}};
 const move=(index:number,direction:number)=>setSelected(old=>{const other=index+direction;if(other<0||other>=old.length)return old;const next=[...old];[next[index],next[other]]=[next[other],next[index]];return next;});
 return <section className="border-top pt-3 d-grid gap-3">
  <h2 className="h5">{t("reportLinks.title")}</h2>
  <p className="text-body-secondary">{t("reportLinks.draftNotice")}</p>
  {loading&&<p role="status">{t("links.loading")}</p>}
  {error&&<p className="alert alert-warning" role="alert">{t("links.error")}</p>}
  {!loading&&!error&&<>
   <input type="search" className="form-control" aria-label={t("links.search")} placeholder={t("links.search")} value={query} onChange={e=>setQuery(e.target.value)}/>
   <div className="list-group">{filtered.map(item=><label key={item.id} className="list-group-item d-flex align-items-center gap-2">
    <input type="checkbox" className="form-check-input" checked={selected.includes(item.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,item.id]:old.filter(x=>x!==item.id))}/>
    <span className="flex-grow-1">{item.title} <small className="text-secondary">({item.categoryName})</small></span>
   </label>)}</div>
   <h3 className="h6">{t("reportLinks.selected")} ({selected.length})</h3>
   <ol className="list-group list-group-numbered">{selected.map((id,index)=>{const item=items.find(x=>x.id===id);return item?<li key={id} className="list-group-item d-flex align-items-center gap-2">
     <span className="flex-grow-1">{item.title}</span><button className="btn btn-outline-secondary btn-sm" type="button" disabled={index===0} onClick={()=>move(index,-1)} aria-label={t("reportLinks.up")}>↑</button><button className="btn btn-outline-secondary btn-sm" type="button" disabled={index===selected.length-1} onClick={()=>move(index,1)} aria-label={t("reportLinks.down")}>↓</button><button className="btn btn-outline-danger btn-sm" type="button" onClick={()=>setSelected(old=>old.filter(x=>x!==id))}>{t("reportLinks.remove")}</button>
    </li>:null;})}</ol>
   <div className="d-flex gap-2 flex-wrap align-items-center"><a className="btn btn-outline-secondary" href={"/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/links/markdown"}>{t("reportLinks.exportMarkdown")}</a><button type="button" className="btn btn-primary" disabled={!dirty||saving} onClick={()=>void save()}>{saving?t("links.saving"):t("links.save")}</button>{saved&&<p className="text-success mt-2" role="status">{t("reportLinks.saved")}</p>}{saveError&&<p className="text-danger mt-2" role="alert">{saveError}</p>}</div>
  </>}
 </section>;
}
