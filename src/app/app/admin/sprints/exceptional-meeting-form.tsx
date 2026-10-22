"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
type Sprint={id:string;name:string;status:string;startAt:string;endAt:string};
type Meeting={id:string;sprintId:string;name:string;status:string;startAt:string;endAt:string;duration:number};
export default function ExceptionalMeetingForm(){
 const t=useTranslation();
 const [sprints,setSprints]=useState<Sprint[]>([]);
 const [meetings,setMeetings]=useState<Meeting[]>([]);
 const [sprintId,setSprintId]=useState("");
 const [name,setName]=useState("");
 const [startAt,setStartAt]=useState("");
 const [duration,setDuration]=useState(60);
 const [warnings,setWarnings]=useState<Array<{name:string;start_at:string;end_at:string}>>([]);
 const [history,setHistory]=useState<unknown[]>([]);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 async function reload(){const r=await fetch("/api/admin/sprints/exceptional-meetings",{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setSprints(j.sprints);setMeetings(j.meetings);}
 useEffect(()=>{void reload().catch(()=>setError(t("exceptionalMeetings.error")));},[]);
 async function submit(e:FormEvent){e.preventDefault();setError("");setNotice("");setBusy(true);setWarnings([]);
 try{const date=new Date(startAt+":00Z");
 if(!Number.isFinite(date.valueOf()))throw Error();
 const r=await fetch("/api/admin/sprints/exceptional-meetings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sprintId,name,startAt:date.toISOString(),duration})});
 const j=await r.json();if(!r.ok){setError(t(j.error==="closed-period"?"exceptionalMeetings.closed":"exceptionalMeetings.error"));return;}
 setWarnings(j.warnings);setNotice(t("exceptionalMeetings.saved"));setName("");setStartAt("");await reload();
 }catch{setError(t("exceptionalMeetings.error"));}finally{setBusy(false);}}
 async function showHistory(id:string){try{const r=await fetch("/api/admin/sprints/exceptional-meetings/"+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setHistory(j.history);}catch{setError(t("exceptionalMeetings.error"));}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("exceptionalMeetings.title")}</h2><p>{t("exceptionalMeetings.info")}</p>
 <form className="d-grid gap-3" onSubmit={submit}>
 <label htmlFor="exceptional-sprint">{t("exceptionalMeetings.sprint")}</label>
 <select required className="form-select" id="exceptional-sprint" value={sprintId} onChange={e=>setSprintId(e.target.value)}><option value="">—</option>{sprints.filter(s=>s.status!=="closed").map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
 <label htmlFor="exceptional-name">{t("exceptionalMeetings.name")}</label><input required id="exceptional-name" maxLength={160} className="form-control" value={name} onChange={e=>setName(e.target.value)}/>
 <label htmlFor="exceptional-start">{t("exceptionalMeetings.start")}</label><input required type="datetime-local" id="exceptional-start" className="form-control" value={startAt} onChange={e=>setStartAt(e.target.value)}/>
 <label htmlFor="exceptional-duration">{t("exceptionalMeetings.duration")}</label><input required type="number" min={1} max={480} id="exceptional-duration" className="form-control" value={duration} onChange={e=>setDuration(Number(e.target.value))}/>
 <button type="submit" className="btn btn-primary" disabled={busy}>{t("exceptionalMeetings.create")}</button></form>
 {notice&&<p role="status" className="alert alert-success mt-3">{notice}</p>}
 {warnings.length>0&&<div role="status" className="alert alert-warning mt-3">{t("exceptionalMeetings.warning")}<ul>{warnings.map((w,i)=><li key={i}>{w.name} — {w.start_at} / {w.end_at}</li>)}</ul></div>}
 {error&&<p role="alert" className="alert alert-danger mt-3">{error}</p>}
 <h3 className="h5 mt-4">{t("exceptionalMeetings.list")}</h3>
 {meetings.map(m=><div key={m.id} className="d-flex justify-content-between border-bottom py-2 gap-2"><span>{m.name} — {m.startAt.slice(0,16)} UTC — {m.status}</span><button className="btn btn-outline-secondary btn-sm" type="button" onClick={()=>showHistory(m.id)}>{t("exceptionalMeetings.history")}</button></div>)}
 {history.length>0&&<pre className="text-wrap mt-2">{JSON.stringify(history,null,2)}</pre>}
 </section>;
}
