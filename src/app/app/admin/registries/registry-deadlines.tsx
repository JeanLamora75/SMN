"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Alert={id:string;title:string;type:"action"|"dependency";dueOn:string;state:"upcoming"|"overdue"};
export default function RegistryDeadlineAlerts({canManage}:{canManage:boolean}){
 const t=useTranslation(),tr=(k:string)=>t(("registryDeadlines."+k) as Parameters<typeof t>[0]);
 const [data,setData]=useState<{days:number;revision:number;alerts:Alert[]}|null>(null),[days,setDays]=useState(3);
 const [revision,setRevision]=useState(0),[error,setError]=useState(false),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false);
 const load=async()=>{const r=await fetch("/api/admin/registries/deadlines",{cache:"no-store"});if(!r.ok)throw Error("unavailable");
  const v=await r.json() as {days:number;alerts:Alert[]};setData(v);setDays(v.days);setRevision(v.revision);};
 useEffect(()=>{let active=true;void fetch("/api/admin/registries/deadlines",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{days:number;alerts:Alert[]}>;}).then(v=>{if(active){setData(v);setDays(v.days);setRevision(v.revision);}}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[]);
 const save=async()=>{setBusy(true);setError(false);setSaved(false);
 try{const response=await fetch("/api/admin/registries/deadlines",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({days,revision})});
  if(!response.ok)throw Error("failed");
  const result=await response.json() as {ok:boolean;revision:number};
  if(!result.ok)throw Error("failed");setRevision(result.revision);await load();setSaved(true);
 }catch{setError(true);}finally{setBusy(false);}};
 return <section className="card p-3 mb-3">
 <h2 className="h5">{tr("heading")}</h2>
 {canManage&&<div className="d-flex gap-2 align-items-end flex-wrap mb-3"><div>
 <label className="form-label" htmlFor="registry-deadline-days">{tr("threshold")}</label>
 <input id="registry-deadline-days" type="number" min={0} max={365} className="form-control" value={days} onChange={e=>setDays(Number(e.target.value))}/></div>
 <button type="button" className="btn btn-outline-primary" disabled={busy||!Number.isInteger(days)||days<0||days>365} onClick={()=>void save()}>{tr("save")}</button></div>}
 {saved&&<p role="status" className="text-success">{tr("saved")}</p>}
 {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 {data&&data.alerts.length===0&&<p>{tr("empty")}</p>}
 <ul className="list-group">{data?.alerts.map(a=><li className="list-group-item" key={a.id}>
 <span className={a.state==="overdue"?"text-danger fw-semibold":"text-warning-emphasis fw-semibold"}>{tr(a.state)}</span>
 {" · "}{tr(a.type)} : <Link href={"/app/admin/registries/"+encodeURIComponent(a.id)}>{a.title}</Link>
 {" · "}{tr("date")} : {a.dueOn}</li>)}</ul>
 </section>;
}
