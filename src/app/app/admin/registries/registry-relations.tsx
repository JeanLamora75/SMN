"use client";
import Link from "next/link";
import {useEffect,useId,useMemo,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {groupRegistryRelations,parseRelationPayload,type RegistryRelation} from "@/lib/registry-relations-view";
import type {RegistryType} from "@/lib/registry-types";
import RegistryTargetSearch from "./registry-target-search";

type Target={id:string;title:string;type:RegistryType|"goal";status?:string};
export default function RegistryRelations({id,type,canManage,onSaved}:{
 id:string;type:string;canManage:boolean;onSaved?:()=>void;
}){
 const t=useTranslation();
 const tr=(key:string)=>t(("registryRelations."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const headingId=useId();
 const [state,setState]=useState<"loading"|"ready"|"unavailable">("loading");
 const [items,setItems]=useState<RegistryRelation[]>([]);
 const [kind,setKind]=useState<"record"|"goal">("record");
 const [selected,setSelected]=useState<Target|null>(null);
 const [showSearch,setShowSearch]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<"unavailable"|"conflict"|"invalid"|null>(null);
 const [reload,setReload]=useState(0);
 const endpoint="/api/admin/registries/"+encodeURIComponent(id)+"/relations";
 useEffect(()=>{
  const ctrl=new AbortController();
  setState("loading");
  void fetch(endpoint,{cache:"no-store",signal:ctrl.signal})
   .then(async response=>{
    if(!response.ok)throw Error("unavailable");
    const parsed=parseRelationPayload(await response.json(),id);
    if(parsed===null)throw Error("invalid");
    return parsed;
   }).then(result=>{
    if(ctrl.signal.aborted)return;
    setItems(result);setState("ready");
   }).catch(()=>{if(!ctrl.signal.aborted)setState("unavailable");});
  return()=>ctrl.abort();
 },[endpoint,id,reload]);
 const groups=useMemo(()=>groupRegistryRelations(items,id),[items,id]);
 const change=async(target:{kind:"record"|"goal";id:string},
  action:"linked"|"unlinked",sourceId=id)=>{
  if(!canManage||busy)return;
  if(action==="unlinked"&&!window.confirm(tr("confirmUnlink")))return;
  setBusy(true);setError(null);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(sourceId)+"/relations",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({target,action})
   });
   if(response.status===409){setError("conflict");return;}
   if(response.status===400||response.status===404){setError("invalid");return;}
   if(!response.ok)throw Error("unavailable");
   const saved=await response.json() as {ok?:boolean};
   if(saved.ok!==true)throw Error("unconfirmed");
   setSelected(null);setShowSearch(false);
   setReload(n=>n+1);
   onSaved?.();
  }catch{setError("unavailable");}
  finally{setBusy(false);}
 };
 return <section className="smn-registry-relation-panel" aria-labelledby={headingId}>
  <h2 className="h5" id={headingId}>{tr("heading")}</h2>
  <p className="small text-body-secondary">{tr("intro")}</p>
  {state==="loading"?<p role="status">{tr("searchLoading")}</p>:
   state==="unavailable"?<div role="alert" className="d-flex align-items-center gap-2">
    <span>{tr("searchUnavailable")}</span>
    <button className="btn btn-sm btn-outline-secondary" type="button"
     onClick={()=>setReload(n=>n+1)}>{tr("retry")}</button>
   </div>:
   groups.length===0?<p className="text-body-secondary small">{tr("empty")}</p>:
   <div className="smn-registry-relation-groups">
    {groups.map(group=><section className="smn-registry-relation-category" key={group.type}>
     <h3 className="h6">{group.type==="goal"?tr("goal"):label(group.type)}
      <span className="small text-body-secondary ms-2">({group.items.length})</span>
     </h3>
     <ul className="smn-registry-relation-items">
      {group.items.map(row=><li key={row.relation.id} className="smn-registry-relation-item">
       <div className="smn-registry-relation-identity">
        <span className="small text-body-secondary">
         {row.direction==="incoming"?tr("directionIncoming"):tr("directionOutgoing")}
        </span>
        {row.linkedType==="goal"?<strong>{row.linkedTitle}</strong>:
         <Link href={"/app/admin/registries/"+encodeURIComponent(row.linkedId)}>
          {row.linkedTitle}</Link>}
        <span className="small text-body-secondary">
         {row.linkedType==="goal"?tr("goal"):label(row.linkedType)}
         {row.linkedStatus&&<> · {label(row.linkedStatus)}</>}
        </span>
       </div>
       {canManage&&<button type="button" className="btn btn-outline-danger btn-sm"
        disabled={busy||row.linkedType==="goal"&&row.relation.targetCycleStatus==="closed"}
        title={row.linkedType==="goal"&&row.relation.targetCycleStatus==="closed"?tr("closedCycle"):undefined}
        onClick={()=>void change({
         kind:row.relation.targetKind,id:row.relation.targetId
        },"unlinked",row.relation.sourceId)}>{tr("remove")}</button>}
      </li>)}
     </ul>
    </section>)}
   </div>}
  {canManage&&<div className="smn-registry-relation-manage">
   <button type="button" className="btn btn-outline-primary btn-sm"
    disabled={busy} aria-expanded={showSearch} aria-controls={headingId+"-search"}
    onClick={()=>{setShowSearch(v=>!v);setSelected(null);}}>
    {tr("associateRecord")}
   </button>
   {showSearch&&<div id={headingId+"-search"} className="smn-registry-relation-associate">
    {type==="action"&&<div>
     <label className="form-label" htmlFor={headingId+"-kind"}>{tr("kind")}</label>
     <select id={headingId+"-kind"} className="form-select" value={kind} disabled={busy}
      onChange={e=>{setKind(e.target.value as "record"|"goal");setSelected(null);}}>
      <option value="record">{tr("record")}</option>
      <option value="goal">{tr("goal")}</option>
     </select>
    </div>}
    <RegistryTargetSearch key={kind} sourceId={id} kind={kind} disabled={busy}
     onSelect={item=>setSelected(item)}/>
    {selected&&<div className="smn-registry-relation-selection">
     <p className="mb-2">{tr("selectedCandidate")}: <strong>{selected.title}</strong>
      {" · "}{selected.type==="goal"?tr("goal"):label(selected.type)}</p>
     <button type="button" className="btn btn-primary btn-sm" disabled={busy}
      onClick={()=>void change({kind,id:selected.id},"linked")}>{tr("add")}</button>
     <button type="button" className="btn btn-outline-secondary btn-sm ms-2"
      disabled={busy} onClick={()=>setSelected(null)}>{tr("cancel")}</button>
    </div>}
   </div>}
  </div>}
  {error&&<p className="small text-danger" role="alert">{tr(error)}</p>}
 </section>;
}
