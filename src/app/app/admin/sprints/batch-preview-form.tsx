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
 function invalidate(){setItems(null);setValid(false);setError("");}
 async function preview(e:FormEvent){e.preventDefault();invalidate();
  if(!Number.isInteger(count)||count<1||count>6||!startOn){setError(t("batchPreview.invalid"));return;}
  setBusy(true);
  try{
   const response=await fetch("/api/admin/sprints/preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({startOn,count}),cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error();
   setItems(data.items);setValid(data.valid);
  }catch{setError(t("batchPreview.error"));}finally{setBusy(false);}
 }
 return <section className="smn-panel p-4 mt-4">
  <h2 className="h4">{t("batchPreview.title")}</h2><p className="text-secondary">{t("batchPreview.intro")}</p>
  <form onSubmit={preview} className="row g-3">
   <div className="col-md-4"><label className="form-label" htmlFor="batch-count">{t("batchPreview.count")}</label>
    <input id="batch-count" type="number" min={1} max={6} step={1} required className="form-control" value={count} onChange={e=>{setCount(e.target.value===""?0:Number(e.target.value));invalidate();}} disabled={busy}/></div>
   <div className="col-md-4"><label className="form-label" htmlFor="batch-start">{t("batchPreview.start")}</label>
    <input id="batch-start" type="date" required className="form-control" value={startOn} onChange={e=>{setStartOn(e.target.value);invalidate();}} disabled={busy}/></div>
   <div className="col-md-4 d-flex align-items-end"><button type="submit" className="btn btn-primary" disabled={busy}>{t("batchPreview.preview")}</button></div>
  </form>
  {error&&<p role="alert" className="alert alert-warning mt-3">{error}</p>}
  {items&&<div className="mt-4">
   <div className="d-flex justify-content-between align-items-center mb-3">
    <h3 className="h5 mb-0">{t("batchPreview.results")}</h3>
    <button type="button" className="btn btn-outline-secondary" onClick={invalidate}>{t("batchPreview.close")}</button>
   </div>
   <div className="table-responsive"><table className="table"><thead><tr><th>{t("batchPreview.name")}</th><th>{t("batchPreview.dates")}</th><th>{t("batchPreview.conflicts")}</th></tr></thead>
   <tbody>{items.map(item=><tr key={item.number}><td>{item.name}</td><td>{item.startOn} {item.startAt.slice(11,16)} UTC → {item.endOn} {item.endAt.slice(11,16)} UTC ({item.timeZone})</td>
    <td>{item.conflicts.length?item.conflicts.map(c=><p className="text-danger mb-1" key={c.id}>{t("batchPreview.conflictWith",{name:c.name,start:c.startAt,end:c.endAt})}</p>):t("batchPreview.none")}</td></tr>)}</tbody></table></div>
   <p role="status">{valid?t("batchPreview.valid"):t("batchPreview.blocked")}</p>
   <button disabled type="button" className="btn btn-primary" title={t("batchPreview.nextStory")}>{t("batchPreview.confirm")}</button>
   <p className="small text-secondary mt-2">{t("batchPreview.nextStory")}</p>
  </div>}
 </section>;
}
