"use client";

import {useState} from "react";
import {useTranslation} from "@/i18n/client";

export default function RegistryDeleteAction({id,title,teamId,onDeleted,className}:{
 id:string;title:string;teamId:string;onDeleted:()=>void;className?:string;
}){
 const t=useTranslation();
 const tr=(key:string,values?:Record<string,string>)=>t(("registryDelete."+key) as Parameters<typeof t>[0],values);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const remove=async()=>{
  if(busy)return;
  setBusy(true);setError(null);
  try{
   const itemResponse=await fetch("/api/admin/registries/"+encodeURIComponent(id)+
    "?teamId="+encodeURIComponent(teamId),{cache:"no-store"});
   if(!itemResponse.ok)throw Error(itemResponse.status===404?"notFound":"unavailable");
   const payload=await itemResponse.json() as {item?:{revision?:number;title?:string}};
   const revision=payload.item?.revision;
   if(!Number.isSafeInteger(revision)||!revision||revision<1)throw Error("unavailable");
   if(!window.confirm(tr("confirm",{title:payload.item?.title??title})))return;
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(id),{
    method:"DELETE",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({teamId,revision})
   });
   if(!response.ok){
    const data=await response.json().catch(()=>({error:"unavailable"})) as {error?:string};
    throw Error(response.status===409?data.error==="linked-data"?"linkedData":"conflict":
     response.status===404?"notFound":"unavailable");
   }
   onDeleted();
  }catch(reason){
   const key=reason instanceof Error&&["notFound","conflict","linkedData"].includes(reason.message)?
    reason.message:"unavailable";
   setError(tr(key));
  }finally{setBusy(false);}
 };
 return <>
  <button type="button" className={className??"btn btn-sm btn-outline-danger"}
   disabled={busy} aria-label={tr("button")+" : "+title} onClick={()=>void remove()}>
   {busy?tr("deleting"):tr("button")}
  </button>
  {error&&<span className="text-danger small d-block" role="alert">{error}</span>}
 </>;
}
