"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import RegistryTargetSearch from "./registry-target-search";
import {registryDetailHref,registryIndexPath,type RegistryNavigation} from "@/lib/registry-navigation";

type Item={id:string;title:string;type:string};
const allowed=["decision","obstacle"] as const;
export default function ActionLinks({id,canManage,navigation,onSaved}:{
 id:string;canManage:boolean;navigation?:RegistryNavigation;onSaved?:()=>void;
}){
 const t=useTranslation(),tr=(key:string)=>t(("actionLinks."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const [loaded,setLoaded]=useState<{
  key:string;state:"ready"|"unavailable";items:Item[];
 }|null>(null);
 const [error,setError]=useState<"conflict"|"unavailable"|null>(null);
 const [busy,setBusy]=useState(false);
 const [selected,setSelected]=useState<{id:string;title:string}|null>(null);
 const [showSearch,setShowSearch]=useState(false);
 const [reload,setReload]=useState(0);
 const endpoint="/api/admin/registries/"+encodeURIComponent(id)+"/action-links";
 const requestKey=endpoint+":"+reload;
 const state=loaded?.key===requestKey?loaded.state:"loading";
 const items=loaded?.key===requestKey?loaded.items:[];
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch(endpoint,{cache:"no-store",signal:ctrl.signal}).then(async res=>{
   if(!res.ok)throw Error("unavailable");
   const body=await res.json() as {links?:Item[]};
   if(!Array.isArray(body.links)||!body.links.every(row=>
    typeof row.id==="string"&&typeof row.title==="string"&&
    allowed.some(type=>type===row.type)))throw Error("invalid");
   return body.links;
  }).then(values=>{if(!ctrl.signal.aborted)setLoaded({
   key:requestKey,state:"ready",items:values
  });})
   .catch(()=>{if(!ctrl.signal.aborted)setLoaded({
    key:requestKey,state:"unavailable",items:[]
   });});
  return()=>ctrl.abort();
 },[endpoint,requestKey]);
 const change=async(relatedId:string,action:"linked"|"unlinked")=>{
  if(!canManage||busy)return;
  if(action==="unlinked"&&!window.confirm(tr("confirmUnlink")))return;
  setBusy(true);setError(null);
  try{
   const response=await fetch(endpoint,{method:"PATCH",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({relatedId,action})});
   if(response.status===409){setError("conflict");return;}
   if(!response.ok)throw Error("failed");
   const body=await response.json() as {ok?:boolean};
   if(body.ok!==true)throw Error("unconfirmed");
   setSelected(null);setShowSearch(false);
   setReload(n=>n+1);onSaved?.();
  }catch{setError("unavailable");}
  finally{setBusy(false);}
 };
 return <section className="smn-registry-relation-panel">
  <h2 className="h5">{tr("heading")}</h2>
  <p className="small text-body-secondary">{tr("intro")}</p>
  {state==="loading"?<p role="status">{tr("loading")}</p>:
   state==="unavailable"?<div role="alert">{tr("unavailable")}{" "}
    <button type="button" className="btn btn-outline-secondary btn-sm"
     onClick={()=>setReload(n=>n+1)}>{tr("retry")}</button></div>:
   items.length===0?<p className="small text-body-secondary">{tr("empty")}</p>:
   <ul className="smn-registry-relation-items">
    {items.map(item=><li key={item.id} className="smn-registry-relation-item">
     <Link href={registryDetailHref(item.id,navigation??{origin:registryIndexPath,trail:[]})}>
      {item.title} · {label(item.type)}</Link>
     {canManage&&<button type="button" className="btn btn-outline-danger btn-sm"
      disabled={busy} onClick={()=>void change(item.id,"unlinked")}>{tr("remove")}</button>}
    </li>)}
   </ul>}
  {canManage&&<div className="smn-registry-relation-manage">
   <button type="button" className="btn btn-outline-primary btn-sm"
    aria-expanded={showSearch} onClick={()=>{setShowSearch(v=>!v);setSelected(null);}}>
    {tr("add")}
   </button>
   {showSearch&&<div className="smn-registry-relation-associate">
    <RegistryTargetSearch sourceId={id} kind="record" types={[...allowed]} disabled={busy}
     onSelect={candidate=>setSelected({id:candidate.id,title:candidate.title})}/>
    {selected&&<div className="smn-registry-relation-selection">
     <p>{tr("selected")}: <strong>{selected.title}</strong></p>
     <button type="button" className="btn btn-primary btn-sm" disabled={busy}
      onClick={()=>void change(selected.id,"linked")}>{tr("add")}</button>
    </div>}
   </div>}
  </div>}
  {error&&<p role="alert" className="text-danger small">{tr(error)}</p>}
 </section>;
}
