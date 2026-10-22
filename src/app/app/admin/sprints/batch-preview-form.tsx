"use client";
import {useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
type Conflict={id:string;name:string;startAt:string;endAt:string;kind:"existing"|"batch"};
type Item={number:number;name:string;startOn:string;endOn:string;startAt:string;endAt:string;timeZone:string;conflicts:Conflict[]};
export default function BatchPreviewForm(){
 const t=useTranslation();
 const [count,setCount]=useState(2);
 const [startOn,setStartOn]=useState("");
 const [items,setItems]=useState<Item[]|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [valid,setValid]=useState(false);
 const [token,setToken]=useState<string|null>(null);
 const [created,setCreated]=useState(0);
 const [history,setHistory]=useState<Array<{id:string;actor_id:string;occurred_at:string;team_id:string;cadence:unknown;sprints:unknown}>>([]);
 const [showHistory,setShowHistory]=useState(false);
 function invalidate(){setItems(null);setToken(null);setValid(false);setError("");setCreated(0);}
 async function preview(e:FormEvent){e.preventDefault();invalidate();
  if(!Number.isInteger(count)||count<1||count>6||!startOn){setError(t("batchPreview.invalid"));return;}
  setBusy(true);
  try{
   const response=await fetch("/api/admin/sprints/preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({startOn,count}),cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error();
   setItems(data.items);setValid(data.valid);setToken(data.token??null);
  }catch{setError(t("batchPreview.error"));}finally{setBusy(false);}
 }
 async function confirm(){if(!valid||!token||busy)return;setBusy(true);setError("");
 try{const r=await fetch("/api/admin/sprints/batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token}),cache:"no-store"});
 const d=await r.json();setToken(null);setItems(null);setValid(false);
 if(!r.ok){setError(t("batchPreview.stale"));return;}
 setCreated(d.sprints.length);
 }catch{setError(t("batchPreview.error"));setToken(null);setItems(null);}finally{setBusy(false);}}
 async function loadHistory(){setBusy(true);setError("");
 try{const r=await fetch("/api/admin/sprints/batch",{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();setHistory(d.history);setShowHistory(true);}
 catch{setError(t("batchPreview.error"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4">
  <h2 className="h4">{t("batchPreview.title")}</h2><p className="text-secondary">{t("batchPreview.intro")}</p>
  <form onSubmit={preview} className="row g-3">
   <div className="col-md-4"><label className="form-label" htmlFor="batch-count">{t("batchPreview.count")}</label>
    <input id="batch-count" type="number" min={1} max={6} step={1} required className="form-control" value={count} onChange={e=>{setCount(e.target.value===""?0:Number(e.target.value));invalidate();}} disabled={busy}/></div>
   <div className="col-md-4"><label className="form-label" htmlFor="batch-start">{t("batchPreview.start")}</label>
    <input id="batch-start" type="date" required className="form-control" value={startOn} onChange={e=>{setStartOn(e.target.value);invalidate();}} disabled={busy}/></div>
   <div className="col-md-4 d-flex align-items-end"><button type="submit" className="btn btn-primary" disabled={busy}>{t("batchPreview.preview")}</button></div>
  </form>
  {created>0&&<p role="status" className="alert alert-success mt-3">{t("batchPreview.created",{count:created})}</p>}
  <button type="button" className="btn btn-outline-secondary mt-3" disabled={busy} onClick={loadHistory}>{t("batchPreview.history")}</button>
  {showHistory&&<div className="mt-3"><h3 className="h5">{t("batchPreview.history")}</h3>{history.length===0?<p>{t("batchPreview.emptyHistory")}</p>:history.map(h=><details key={h.id}><summary>{h.occurred_at} — {h.actor_id} — {h.team_id}</summary><pre className="text-wrap">{JSON.stringify({cadence:h.cadence,sprints:h.sprints},null,2)}</pre></details>)}</div>}
  {error&&<p role="alert" className="alert alert-warning mt-3">{error}</p>}
  {items&&<div className="mt-4">
   <div className="d-flex justify-content-between align-items-center mb-3">
    <h3 className="h5 mb-0">{t("batchPreview.results")}</h3>
    <button type="button" className="btn btn-outline-secondary" onClick={invalidate}>{t("batchPreview.close")}</button>
   </div>
   <div className="table-responsive"><table className="table"><thead><tr><th>{t("batchPreview.name")}</th><th>{t("batchPreview.dates")}</th><th>{t("batchPreview.conflicts")}</th></tr></thead>
   <tbody>{items.map(item=><tr key={item.number}><td>{item.name}</td><td>{new Intl.DateTimeFormat("fr-FR",{timeZone:item.timeZone,dateStyle:"short",timeStyle:"short"}).format(new Date(item.startAt))} → {new Intl.DateTimeFormat("fr-FR",{timeZone:item.timeZone,dateStyle:"short",timeStyle:"short"}).format(new Date(item.endAt))} ({item.timeZone})</td>
    <td>{item.conflicts.length?item.conflicts.map(c=><p className="text-danger mb-1" key={c.id}>{t("batchPreview.conflictWith",{name:c.name,start:c.startAt,end:c.endAt})}</p>):t("batchPreview.none")}</td></tr>)}</tbody></table></div>
   <p role="status">{valid?t("batchPreview.valid"):t("batchPreview.blocked")}</p>
   <button disabled={!valid||!token||busy} type="button" className="btn btn-primary" onClick={confirm}>{t("batchPreview.confirm")}</button>
  </div>}
 </section>;
}
