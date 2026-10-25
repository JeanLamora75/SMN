"use client";
import Link from "next/link";
import {useEffect,useId,useMemo,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {groupRegistryRelations,parseRelationPayload,type RegistryRelation} from "@/lib/registry-relations-view";
import type {RegistryType} from "@/lib/registry-types";
import RegistryTargetSearch from "./registry-target-search";
import {registryDetailHref,registryIndexPath,type RegistryNavigation} from "@/lib/registry-navigation";

type Target={id:string;title:string;type:RegistryType|"goal";status?:string};
const emptyRelations:RegistryRelation[]=[];
export default function RegistryRelations({id,type,canManage,navigation,onSaved}:{
 id:string;type:string;canManage:boolean;navigation?:RegistryNavigation;onSaved?:()=>void;
}){
 const t=useTranslation();
 const tr=(key:string)=>t(("registryRelations."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const headingId=useId();
 const [loaded,setLoaded]=useState<{
  key:string;state:"ready"|"unavailable";items:RegistryRelation[];
 }|null>(null);
 const [kind,setKind]=useState<"record"|"goal">("record");
 const [selected,setSelected]=useState<Target|null>(null);
 const [showSearch,setShowSearch]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<"unavailable"|"conflict"|"invalid"|null>(null);
 const [reload,setReload]=useState(0);
 const endpoint="/api/admin/registries/"+encodeURIComponent(id)+"/relations";
 const requestKey=endpoint+":"+reload;
 const state=loaded?.key===requestKey?loaded.state:"loading";
 const items=loaded?.key===requestKey?loaded.items:emptyRelations;
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch(endpoint,{cache:"no-store",signal:ctrl.signal})
   .then(async response=>{
    if(!response.ok)throw Error("unavailable");
    const parsed=parseRelationPayload(await response.json(),id);
    if(parsed===null)throw Error("invalid");
    return parsed;
   }).then(result=>{
    if(ctrl.signal.aborted)return;
    setLoaded({key:requestKey,state:"ready",items:result});
   }).catch(()=>{if(!ctrl.signal.aborted)setLoaded({
    key:requestKey,state:"unavailable",items:[]
   });});
  return()=>ctrl.abort();
 },[endpoint,id,requestKey]);
 const groups=useMemo(()=>groupRegistryRelations(items,id),[items,id]);
 const change=async(target:{kind:"record"|"goal";id:string},
  action:"linked"|"unlinked",sourceId=id)=>{
  if(!canManage||busy)return;
  if(action==="unlinked"&&!window.confirm(tr(target.kind==="goal"?"confirmUnlinkGoal":"confirmUnlink")))return;
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
        {row.linkedType==="goal"?
         row.relation.targetGoalSprintId?
          <Link href={"/app/admin/sprints/"+encodeURIComponent(row.relation.targetGoalSprintId)}>
           {row.linkedTitle}</Link>:<strong>{row.linkedTitle}</strong>:
         <Link href={registryDetailHref(row.linkedId,navigation??{origin:registryIndexPath,trail:[]})}>
          {row.linkedTitle}</Link>}
        <span className="small text-body-secondary">
         {row.linkedType==="goal"?tr("goal"):label(row.linkedType)}
         {row.linkedStatus&&<> · {label(row.linkedStatus)}</>}
        </span>
       </div>
       {canManage&&(row.linkedType==="goal"&&row.relation.targetCycleStatus==="closed"?
        <span className="small text-body-secondary">{tr("closedCycle")}</span>:
        <button type="button" className="btn btn-outline-danger btn-sm"
         disabled={busy} onClick={()=>void change({
          kind:row.relation.targetKind,id:row.relation.targetId
         },"unlinked",row.relation.sourceId)}>{tr("remove")}</button>)}
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
