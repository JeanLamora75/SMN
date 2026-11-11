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
    const data=await response.json().catch(()=>({error:"unavailable"})) as {error?:string;diagnosticCode?:string};
    const key=response.status===409?data.error==="linked-data"?"linkedData":"conflict":
     response.status===404?"notFound":
     data.error==="schema-mismatch"?"schemaMismatch":
     data.error==="protected-operation"?"protectedOperation":
     data.error==="operation-timeout"?"operationTimeout":"unavailable";
    const diagnostic=typeof data.diagnosticCode==="string"&&/^PG-[0-9A-Z]{5}$/.test(data.diagnosticCode)?
     " ["+data.diagnosticCode+"]":"";
    throw Error(key+diagnostic);
   }
   onDeleted();
  }catch(reason){
   const message=reason instanceof Error?reason.message:"";
   const [candidate,diagnostic]=message.split(" [");
   const key=["notFound","conflict","linkedData","schemaMismatch","protectedOperation","operationTimeout"].includes(candidate)?
    candidate:"unavailable";
   setError(tr(key)+(diagnostic&&/^PG-[0-9A-Z]{5}\]$/.test(diagnostic)?" ["+diagnostic:""));
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
