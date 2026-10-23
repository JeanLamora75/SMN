"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Revision={revision:number;changedAt:string;actorId:string|null;beforeValues:Record<string,unknown>|null;afterValues:Record<string,unknown>};
const fields=["title","occurredOn","status","description","owner","dueOn","comment"] as const;
export default function RegistryHistory({id}:{id:string}){
 const t=useTranslation();const [data,setData]=useState<Revision[]|null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/history",{cache:"no-store",signal:ctrl.signal})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<{revisions:Revision[]}>;})
   .then(r=>{if(!ctrl.signal.aborted)setData(r.revisions);})
   .catch(()=>{if(!ctrl.signal.aborted)setError(true);});
  return()=>ctrl.abort();
 },[id]);
 const tr=(key:string)=>t(("registryCreate."+key) as Parameters<typeof t>[0]);
 return <section className="card p-3 mt-3" aria-label={tr("history")}>
  <h2 className="h5">{tr("history")}</h2>
  {error?<p role="alert">{tr("historyError")}</p>:data===null?<p role="status">…</p>:
   data.length===0?<p>{tr("historyEmpty")}</p>:<div className="accordion" id="registry-revisions">
   {data.map(row=><details className="border rounded p-3 mb-2" key={row.revision}>
    <summary>{tr("revision")} {row.revision} — {row.changedAt} — {tr("actor")}: {row.actorId??"—"}</summary>
    <div className="table-responsive mt-2"><table className="table table-sm">
     <thead><tr><th scope="col">{tr("titleField")}</th><th scope="col">{tr("before")}</th><th scope="col">{tr("after")}</th></tr></thead>
     <tbody>{fields.map(field=><tr key={field}><th scope="row">{tr(field==="occurredOn"?"date":field==="dueOn"?"due":field==="title"?"titleField":field)}</th>
      <td>{String(row.beforeValues?.[field]??"—")}</td><td>{String(row.afterValues?.[field]??"—")}</td></tr>)}</tbody>
    </table></div>
   </details>)}
   </div>}
 </section>;
}
