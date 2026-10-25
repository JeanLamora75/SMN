"use client";
import {useEffect,useId,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {registryTypes,registryStatuses,type RegistryType} from "@/lib/registry-types";

type Target={id:string;title:string;type:RegistryType|"goal";status?:string};
const validId=(id:unknown)=>typeof id==="string"&&
 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const isRecordType=(value:unknown):value is RegistryType=>
 typeof value==="string"&&registryTypes.some(type=>type===value);
function parseCandidates(raw:unknown,kind:"record"|"goal"):Target[]|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const payload=raw as {state?:unknown;items?:unknown};
 if(payload.state!=="available"||!Array.isArray(payload.items)||payload.items.length>25)return null;
 const result:Target[]=[];
 for(const item of payload.items){
  if(!item||typeof item!=="object"||Array.isArray(item))return null;
  const c=item as Record<string,unknown>;
  if(!validId(c.id)||typeof c.title!=="string"||!c.title.trim())return null;
  if(kind==="goal"){
   if(c.type!=="goal")return null;
   result.push({id:c.id as string,title:c.title,type:"goal"});
  }else{
   if(!isRecordType(c.type)||typeof c.status!=="string"||
    !(registryStatuses[c.type] as readonly string[]).includes(c.status))return null;
   result.push({id:c.id as string,title:c.title,type:c.type,status:c.status});
  }
 }
 return result;
}

export default function RegistryTargetSearch({sourceId,kind,types=[],disabled,onSelect}:{
 sourceId:string;kind:"record"|"goal";types?:readonly RegistryType[];
 disabled:boolean;onSelect:(item:Target)=>void;
}){
 const t=useTranslation(),tr=(key:string)=>t(("registryRelations."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const fieldId=useId();
 const [search,setSearch]=useState("");
 const [filterType,setFilterType]=useState<RegistryType|"all">("all");
 const [loaded,setLoaded]=useState<{
  key:string;state:"ready"|"unavailable";items:Target[];
 }|null>(null);
 const [reload,setReload]=useState(0);
 const typesKey=types.join(",");
 const requestKey=JSON.stringify([sourceId,kind,search,filterType,reload,typesKey]);
 const state=loaded?.key===requestKey?loaded.state:"loading";
 const items=loaded?.key===requestKey?loaded.items:[];
 useEffect(()=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   const params=new URLSearchParams({kind,search:search.trim(),types:
    kind==="goal"?"":typesKey|| (filterType==="all"?"":filterType)});
   void fetch("/api/admin/registries/"+encodeURIComponent(sourceId)+
    "/relation-candidates?"+params.toString(),{cache:"no-store",signal:controller.signal})
    .then(async response=>{
     if(!response.ok)throw Error("unavailable");
     const parsed=parseCandidates(await response.json(),kind);
     if(parsed===null)throw Error("invalid");
     return parsed;
    }).then(values=>{
     if(controller.signal.aborted)return;
     setLoaded({key:requestKey,state:"ready",items:values});
    }).catch(()=>{if(!controller.signal.aborted)setLoaded({
     key:requestKey,state:"unavailable",items:[]
    });});
  },250);
  return()=>{clearTimeout(timer);controller.abort();};
 },[sourceId,kind,search,filterType,reload,typesKey,requestKey]);
 return <div className="smn-registry-relation-search">
  <div className="row g-2">
   {kind==="record"&&types.length===0&&<div className="col-sm-4">
    <label htmlFor={fieldId+"-type"} className="form-label">{tr("selectType")}</label>
    <select id={fieldId+"-type"} className="form-select" value={filterType} disabled={disabled}
     onChange={e=>setFilterType(e.target.value as RegistryType|"all")}>
     <option value="all">{tr("allTypes")}</option>
     {registryTypes.map(type=><option key={type} value={type}>{label(type)}</option>)}
    </select>
   </div>}
   <div className={kind==="record"&&types.length===0?"col-sm-8":"col-12"}>
    <label htmlFor={fieldId+"-search"} className="form-label">{tr("searchLabel")}</label>
    <input id={fieldId+"-search"} type="search" className="form-control" value={search}
     maxLength={120} disabled={disabled} placeholder={tr("searchPlaceholder")}
     onChange={event=>setSearch(event.target.value)}/>
   </div>
  </div>
  {state==="loading"?<p className="small text-body-secondary" role="status">{tr("searchLoading")}</p>:
   state==="unavailable"?<div role="alert" className="d-flex gap-2 align-items-center">
    <span>{tr("searchUnavailable")}</span>
    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={disabled}
     onClick={()=>setReload(n=>n+1)}>{tr("retry")}</button>
   </div>:
   items.length===0?<p className="small text-body-secondary">{tr("noMatches")}</p>:
   <ul className="smn-registry-candidates">
    {items.map(candidate=><li key={candidate.id}>
     <button type="button" className="btn btn-outline-secondary btn-sm"
      disabled={disabled} onClick={()=>onSelect(candidate)}>
      <strong>{candidate.title}</strong>
      <span>{candidate.type==="goal"?tr("goal"):label(candidate.type)}
       {candidate.status?" · "+label(candidate.status):""}</span>
      <span className="visually-hidden">{tr("chooseCandidate")}</span>
     </button>
    </li>)}
   </ul>}
 </div>;
}
