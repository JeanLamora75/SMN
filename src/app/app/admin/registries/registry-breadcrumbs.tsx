"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {
 registryDetailHref,registryIndexPath,type RegistryNavigation
} from "@/lib/registry-navigation";

type Ancestor={id:string;title:string|null};
export default function RegistryBreadcrumbs({id,title,teamId,navigation}:{
 id:string;title?:string;teamId:string;navigation:RegistryNavigation;
}){
 const t=useTranslation();
 const tr=(key:string)=>t(("registryNavigation."+key) as Parameters<typeof t>[0]);
 const [ancestors,setAncestors]=useState<Ancestor[]>([]);
 const trailKey=navigation.trail.join(",");
 useEffect(()=>{
  if(!title||!id||!trailKey){return;}
  const ctrl=new AbortController();
  void Promise.all(trailKey.split(",").map(async id=>{
   try{
    const response=await fetch(registryIndexPath+"/"+encodeURIComponent(id),{
     cache:"no-store",signal:ctrl.signal
    });
    if(!response.ok)return {id,title:null};
    const data=await response.json() as {item?:{id?:unknown;title?:unknown;teamId?:unknown}};
    const record=data.item;
    if(record?.id!==id||record.teamId!==teamId||typeof record.title!=="string")
     return {id,title:null};
    return {id,title:record.title};
   }catch{return {id,title:null};}
  })).then(items=>{if(!ctrl.signal.aborted)setAncestors(items);});
  return()=>ctrl.abort();
 },[title,teamId,id,trailKey]);
 const previous=navigation.trail.at(-1);
 const last=ancestors.at(-1);
 return <nav className="smn-registry-breadcrumbs mb-3" aria-label={tr("aria")}>
  <ol className="breadcrumb mb-2 flex-wrap">
   <li className="breadcrumb-item">
    <Link href={navigation.origin}>{tr("registers")}</Link>
   </li>
   {title&&navigation.trail.map((ancestorId,index)=>{
    const resolved=ancestors[index]?.id===ancestorId?ancestors[index].title:null;
    return <li className="breadcrumb-item" key={index}>
     {resolved?<Link href={registryDetailHref(ancestorId,{
      origin:navigation.origin,trail:navigation.trail.slice(0,index)
     })}>{resolved}</Link>:
      <span className="text-body-secondary">{tr("inaccessible")}</span>}
    </li>;
   })}
   {title&&<li className="breadcrumb-item active" aria-current="page">{title}</li>}
  </ol>
  <div className="d-flex flex-wrap gap-2">
   {previous&&last?.id===previous&&last.title&&<Link
    className="btn btn-sm btn-outline-secondary"
    href={registryDetailHref(previous,{
     origin:navigation.origin,trail:navigation.trail.slice(0,-1)
    })}>
    {tr("previous")}
   </Link>}
   <Link href={navigation.origin} className="btn btn-sm btn-link ps-0">
    {tr("backToResults")}
   </Link>
  </div>
 </nav>;
}
