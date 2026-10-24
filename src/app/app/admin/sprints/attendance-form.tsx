"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useCurrentTime} from "./use-current-time";
import {useEpic4Presentation} from "./i18n-presentation";
type Kind="standard"|"custom"|"exceptional";
type Event={id:string;kind:Kind;sprintName:string;startAt:string;endAt:string;status:string;explicit:boolean};
export default function AttendanceForm(){
 const t=useTranslation();const presentation=useEpic4Presentation();const now=useCurrentTime();
 const [events,setEvents]=useState<Event[]>([]);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [reason,setReason]=useState("");
 const [selected,setSelected]=useState("");
 const [history,setHistory]=useState<unknown[]>([]);
 async function load(){setBusy(true);try{const r=await fetch("/api/admin/sprints/attendance",{cache:"no-store"});if(!r.ok)throw Error();const data=await r.json();setEvents(data.events);}catch{setError(t("attendance.error"));}finally{setBusy(false);}}
 useEffect(()=>{void Promise.resolve().then(load);},[]);
 async function change(e:Event,status:"held"|"not_held"|"cancelled"){setBusy(true);setError("");setNotice("");
 try{const r=await fetch("/api/admin/sprints/attendance",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:e.kind,id:e.id,status,reason})});
 if(!r.ok)throw Error();setNotice(t("attendance.saved"));setReason("");await load();
 }catch{setError(t("attendance.error"));}finally{setBusy(false);}}
 async function showHistory(e:Event){setSelected(e.kind+":"+e.id);try{const r=await fetch("/api/admin/sprints/attendance?kind="+encodeURIComponent(e.kind)+"&id="+encodeURIComponent(e.id));if(!r.ok)throw Error();setHistory((await r.json()).history);}catch{setError(t("attendance.error"));}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("attendance.title")}</h2><p>{t("attendance.intro")}</p>
 <button type="button" className="btn btn-outline-primary" onClick={load} disabled={busy}>{t("attendance.refresh")}</button>
 <label className="form-label d-block mt-3" htmlFor="attendance-reason">{t("attendance.reason")}</label><input id="attendance-reason" className="form-control mb-3" maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/>
 <div className="table-responsive"><table className="table"><thead><tr><th>{t("attendance.event")}</th><th>{t("attendance.status")}</th><th>{t("attendance.actions")}</th></tr></thead><tbody>
 {events.map(e=><tr key={e.kind+e.id}><td>{e.sprintName} — {presentation.kind(e.kind)}<div className="small text-secondary">{presentation.date(e.startAt)}</div></td>
 <td>{presentation.status(e.status)}</td>
 <td><div className="d-flex flex-wrap gap-1">
 <button type="button" className="btn btn-outline-success btn-sm" disabled={busy||now===null||Date.parse(e.endAt)>now} onClick={()=>change(e,"held")}>{t("attendance.held")}</button>
 <button type="button" className="btn btn-outline-warning btn-sm" disabled={busy||now===null||Date.parse(e.endAt)>now} onClick={()=>change(e,"not_held")}>{t("attendance.not_held")}</button>
 <button type="button" className="btn btn-outline-danger btn-sm" disabled={busy} onClick={()=>change(e,"cancelled")}>{t("attendance.cancelled")}</button>
 <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>showHistory(e)}>{t("attendance.history")}</button></div></td></tr>)}
 </tbody></table></div>
 {selected&&history.length>0&&<pre className="text-wrap">{JSON.stringify(history,null,2)}</pre>}
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}{notice&&<p role="status" className="alert alert-success">{notice}</p>}
 </section>;
}
