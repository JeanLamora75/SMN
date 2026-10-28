"use client";
import {useEffect,useMemo,useState} from "react";
import {useTranslation} from "@/i18n/client";
type LinkItem={id:string;title:string;url:string;categoryName:string;scope:"TRANSVERSE"|"EQUIPE"};
export default function ReportLinkSelection({sprintId}:{sprintId:string}){
 const t=useTranslation();
 const [items,setItems]=useState<LinkItem[]>([]),[selected,setSelected]=useState<string[]>([]);
 const [query,setQuery]=useState(""),[error,setError]=useState(false),[loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController();
  void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/links",{cache:"no-store",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{items:LinkItem[]}>;})
   .then(data=>{if(!controller.signal.aborted){if(!Array.isArray(data.items))throw Error();setItems(data.items);setError(false);}})
   .catch(()=>{if(!controller.signal.aborted)setError(true);})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[sprintId]);
 const filtered=useMemo(()=>items.filter(item=>(item.title+" "+item.categoryName).toLocaleLowerCase().includes(query.toLocaleLowerCase())),[items,query]);
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
  </>}
 </section>;
}
