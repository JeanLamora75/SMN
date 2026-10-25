"use client";
import Link from "next/link";
import {useId,useState} from "react";
import {useTranslation} from "@/i18n/client";
import type {RegistryAttentionEntry} from "@/lib/registry-attention-view";
import BootstrapIcon from "../../bootstrap-icon";

/** Display-only; the global registry loads SMN-104 once and shares its verified results. */
export default function AttentionCockpit({items,loading,error,onRetry}:{
 items:readonly RegistryAttentionEntry[]|null;loading:boolean;error:boolean;onRetry:()=>void;
}){
 const t=useTranslation(),tr=(key:string)=>t(("registryAttention."+key) as Parameters<typeof t>[0]);
 const label=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 const [expanded,setExpanded]=useState(false);
 const detailsId=useId();
 const available=!loading&&!error&&items!==null;
 const count=available?t("registryAttention.count",{count:items.length}):
  tr(loading?"countLoading":"countUnavailable");
 return <section className="smn-registry-attention-band" aria-label={tr("heading")}>
  <div className="smn-registry-attention-head">
   <span className="smn-registry-attention-icon" aria-hidden="true"><BootstrapIcon name="bell-fill"/></span>
   <div className="smn-registry-attention-identity">
    <h2 className="smn-registry-attention-title">{tr("heading")}</h2>
    <span className="smn-registry-attention-count" role="status">{count}</span>
   </div>
   <div className="smn-registry-attention-controls">
    {!loading&&error&&<button type="button" className="btn btn-outline-secondary btn-sm"
     onClick={onRetry}>{tr("retry")}</button>}
    <button type="button" className="btn btn-outline-secondary btn-sm"
     aria-expanded={expanded} aria-controls={detailsId} disabled={!available}
     onClick={()=>setExpanded(value=>!value)}>
     {tr(expanded?"collapse":"expand")}
    </button>
   </div>
  </div>
  {error&&<p role="alert" className="smn-registry-attention-error">{tr("unavailable")}</p>}
  <div id={detailsId} className="smn-registry-attention-body" hidden={!expanded||!available}>
   {available&&<><p className="small text-body-secondary mb-2">{tr("intro")}</p>
   {items.length===0?<p className="small mb-0">{tr("empty")}</p>:
    <ul className="smn-registry-attention-items">
     {items.map((item,index)=><li className="smn-registry-attention-item"
      key={item.id+":"+item.reason+":"+index}>
      <strong className="smn-registry-attention-reason">{tr(item.reason)}</strong>
      <Link href={"/app/admin/registries/"+encodeURIComponent(item.id)}>{item.title}</Link>
      <span className="smn-registry-attention-context">
       {label(item.type)} · {tr("status")}: {label(item.status)}
       {item.dueOn&&<> · {tr("due")}: <time dateTime={item.dueOn}>{item.dueOn}</time></>}
      </span>
     </li>)}
    </ul>}</>}
  </div>
 </section>;
}
