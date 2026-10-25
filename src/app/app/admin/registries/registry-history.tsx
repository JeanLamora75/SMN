"use client";
import {useEffect,useId,useMemo,useState} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import {changedFields,formatAuditValue,parseAuditPage,
 type AuditEvent,type AuditKind,type AuditAction} from "@/lib/registry-audit-timeline";

const translationKeys=new Set(["open","resolved","in_progress","abandoned","satisfied",
 "cancelled","active","replaced","todo","completed","recorded","owned","accepted","mitigated"]);
export default function RegistryHistory({id}:{id:string}){
 const t=useTranslation(),locale=useLocale();
 const tr=(key:string)=>t(("registryAudit."+key) as Parameters<typeof t>[0]);
 const localId=useId();
 const [events,setEvents]=useState<AuditEvent[]>([]);
 const [page,setPage]=useState(1);
 const [hasMore,setHasMore]=useState(false);
 const [state,setState]=useState<"loading"|"ready"|"unavailable">("loading");
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  if(page===1)setState("loading");
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/history?page="+page,{
   cache:"no-store",signal:controller.signal
  }).then(async response=>{
   if(!response.ok)throw Error("unavailable");
   const parsed=parseAuditPage(await response.json() as unknown);
   if(!parsed||parsed.page!==page)throw Error("invalid");
   return parsed;
  }).then(payload=>{
   if(controller.signal.aborted)return;
   setEvents(previous=>page===1?payload.events:[
    ...previous,...payload.events.filter(event=>!previous.some(old=>old.id===event.id))
   ]);
   setHasMore(payload.hasMore);
   setState("ready");
  }).catch(()=>{if(!controller.signal.aborted)setState("unavailable");});
  return()=>controller.abort();
 },[id,page,retry]);
 const dates=useMemo(()=>new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Paris"
 }),[locale]);
 const fieldLabel=(key:string)=>tr(key);
 const value=(input:unknown)=>{
  const human=formatAuditValue(input);
  if(human===null)return tr("notAvailable");
  if(human==="yes"||human==="no"||human==="local")return tr(human);
  if(translationKeys.has(human))return t(("registryCreate."+human) as Parameters<typeof t>[0]);
  return human;
 };
 const title=(kind:AuditKind,action:AuditAction)=>tr(kind)+" · "+tr(action);
 const reset=()=>{setPage(1);setRetry(n=>n+1);};
 return <section className="smn-registry-audit" aria-labelledby={localId+"-title"}>
  <h2 className="h5 mb-1" id={localId+"-title"}>{tr("history")}</h2>
  <p className="small text-body-secondary">{tr("intro")}</p>
  {state==="loading"&&events.length===0?<p role="status">{tr("loading")}</p>:null}
  {state==="unavailable"&&<div role="alert" className="d-flex flex-wrap gap-2 align-items-center">
   <span>{tr("unavailable")}</span>
   <button type="button" className="btn btn-sm btn-outline-secondary"
    onClick={()=>setRetry(n=>n+1)}>{tr("retry")}</button>
  </div>}
  {state==="ready"&&events.length===0?<p className="smn-registry-audit-empty">{tr("empty")}</p>:null}
  {events.length>0&&<ol className="smn-registry-audit-timeline">
   {events.map(event=>{
    const diff=changedFields(event);
    return <li key={event.id} className="smn-registry-audit-event">
     <div className="smn-registry-audit-heading">
      <strong>{title(event.kind,event.action)}</strong>
      <time dateTime={event.at}>{dates.format(new Date(event.at))}</time>
     </div>
     <div className="small text-body-secondary">
      {tr("actor")}: {event.actorName??tr("unknownAuthor")}
      {event.revision!==null&&<> · {tr("revision")} {event.revision}</>}
     </div>
     <details className="smn-registry-audit-diff">
      <summary>{tr("showChanges")} ({diff.length})</summary>
      {diff.length===0?<p className="small text-body-secondary mb-0">{tr("noChanges")}</p>:
       <div className="table-responsive">
        <table className="table table-sm mb-0">
         <thead><tr><th scope="col">{tr("field")}</th>
          <th scope="col">{tr("before")}</th><th scope="col">{tr("after")}</th></tr></thead>
         <tbody>{diff.map(change=><tr key={change.key}>
          <th scope="row">{fieldLabel(change.key)}</th>
          <td className="smn-registry-audit-value">{value(change.before)}</td>
          <td className="smn-registry-audit-value">{value(change.after)}</td>
         </tr>)}</tbody>
        </table>
       </div>}
     </details>
    </li>;
   })}
  </ol>}
  {hasMore&&state==="ready"&&<button className="btn btn-outline-secondary btn-sm"
   type="button" onClick={()=>{setState("loading");setPage(x=>x+1);}}>
   {tr("loadMore")}
  </button>}
  {state==="loading"&&events.length>0&&<p role="status">{tr("loading")}</p>}
 </section>;
}
