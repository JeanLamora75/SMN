"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Lunch={start:string;end:string;revision:number};
export default function LunchForm(){
 const t=useTranslation(),[value,setValue]=useState<Lunch|null>(null),[original,setOriginal]=useState<Lunch|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[teamId,setTeamId]=useState<string|null>(null);
 const dirty=original!==null&&value!==null&&(value.start!==original.start||value.end!==original.end);
 useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
 useEffect(()=>{fetch("/api/admin/sprints/lunch",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(x=>{setTeamId(x.teamId??null);setValue(x.lunch);setOriginal(x.lunch);}).catch(()=>setError(t("sprintLunch.error")));},[t]);
 async function save(e:FormEvent){e.preventDefault();if(!value)return;setBusy(true);setError("");setNotice("");
 try{const r=await fetch("/api/admin/sprints/lunch",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...value,...(teamId?{teamId}:{})})});const d=await r.json();if(!r.ok)throw Error();setValue(d.lunch);setOriginal(d.lunch);setNotice(t("sprintLunch.saved"));}
 catch{setError(t("sprintLunch.error"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("sprintLunch.title")}</h2><p>{t("sprintLunch.note")}</p>
 {value&&<form className="row g-3" onSubmit={save}><div className="col-md-4"><label className="form-label" htmlFor="lunch-start">{t("sprintLunch.start")}</label><input className="form-control" id="lunch-start" type="time" required value={value.start} onChange={e=>setValue({...value,start:e.target.value})}/></div>
 <div className="col-md-4"><label className="form-label" htmlFor="lunch-end">{t("sprintLunch.end")}</label><input className="form-control" id="lunch-end" type="time" required value={value.end} onChange={e=>setValue({...value,end:e.target.value})}/></div>
 <div className="col-md-4 d-flex align-items-end"><button className="btn btn-primary" type="submit" disabled={busy}>{t("sprintLunch.save")}</button></div></form>}
 {error&&<p role="alert" className="alert alert-warning mt-3">{error}</p>}{notice&&<p role="status" className="alert alert-success mt-3">{notice}</p>}
 </section>;
}
