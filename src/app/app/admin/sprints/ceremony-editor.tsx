"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
type C={id:string;kind:string;startAt:string;endAt:string;minutes:number;revision:number;status:string;provenance:string;generationSource:string;sprintName:string};
export default function CeremonyEditor(){
 const t=useTranslation();
 const [rows,setRows]=useState<C[]>([]);
 const [selected,setSelected]=useState("");
 const [startAt,setStartAt]=useState("");
 const [minutes,setMinutes]=useState(15);
 const [scope,setScope]=useState("single");
 const [history,setHistory]=useState<unknown[]>([]);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function reload(){const r=await fetch("/api/admin/sprints/ceremonies",{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();setRows(d.ceremonies);}
 useEffect(()=>{reload().catch(()=>setError(t("ceremonyEdit.error")));},[t]);
 const item=rows.find(x=>x.id===selected);
 function pick(id:string){const x=rows.find(v=>v.id===id);setSelected(id);setStartAt(x?new Date(x.startAt).toISOString().slice(0,16):"");setMinutes(x?.minutes??15);setScope("single");setHistory([]);setMessage("");setError("");}
 async function save(e:FormEvent){e.preventDefault();if(!item)return;setBusy(true);setError("");setMessage("");
 try{const r=await fetch("/api/admin/sprints/ceremonies/"+encodeURIComponent(item.id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({startAt:new Date(startAt+":00Z").toISOString(),minutes,scope,revision:item.revision})});const d=await r.json();if(!r.ok)throw Error();
 setMessage(t(d.warningCount>0?"ceremonyEdit.warning":"ceremonyEdit.saved"));await reload();setSelected("");}
 catch{setError(t("ceremonyEdit.error"));}finally{setBusy(false);}}
 async function loadHistory(){if(!selected)return;try{const r=await fetch("/api/admin/sprints/ceremonies/"+encodeURIComponent(selected),{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();setHistory(d.history);}catch{setError(t("ceremonyEdit.error"));}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("ceremonyEdit.title")}</h2>
 <label htmlFor="ceremony-id" className="form-label">{t("ceremonyEdit.choose")}</label>
 <select id="ceremony-id" className="form-select" value={selected} onChange={e=>pick(e.target.value)}><option value="">—</option>{rows.map(c=><option key={c.id} value={c.id}>{c.sprintName} — {c.kind} — {c.startAt.slice(0,16)} — {c.status}</option>)}</select>
 {item&&<form onSubmit={save} className="d-grid gap-3 mt-3">
  <label htmlFor="ceremony-date">{t("ceremonyEdit.start")}</label><input id="ceremony-date" type="datetime-local" className="form-control" required disabled={item.status!=="scheduled"||busy} value={startAt} onChange={e=>setStartAt(e.target.value)}/>
  <label htmlFor="ceremony-minutes">{t("ceremonyEdit.minutes")}</label><input id="ceremony-minutes" type="number" className="form-control" min={1} max={600} required value={minutes} onChange={e=>setMinutes(Number(e.target.value))} disabled={item.status!=="scheduled"||busy}/>
  {item.kind==="daily"&&<><label htmlFor="ceremony-scope">{t("ceremonyEdit.scope")}</label><select id="ceremony-scope" className="form-select" value={scope} onChange={e=>setScope(e.target.value)}><option value="single">{t("ceremonyEdit.single")}</option><option value="following">{t("ceremonyEdit.following")}</option></select></>}
  <button className="btn btn-primary" disabled={item.status!=="scheduled"||busy}>{t("ceremonyEdit.save")}</button>
  <button type="button" className="btn btn-outline-secondary" onClick={loadHistory}>{t("ceremonyEdit.history")}</button>
 </form>}
 {history.length>0&&<pre className="text-wrap mt-3">{JSON.stringify(history,null,2)}</pre>}
 {message&&<p role="status" className="alert alert-info mt-3">{message}</p>}
 {error&&<p role="alert" className="alert alert-danger mt-3">{error}</p>}
 </section>;
}
