"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Warning={kind:"overlap"|"closure";eventId:string;eventTitle:string;otherId?:string;otherTitle?:string;startAt:string;endAt:string;detail?:string};
export default function MeetingConflicts(){
 const t=useTranslation();
 const [warnings,setWarnings]=useState<Warning[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function reload(){setBusy(true);setError("");
  try{const r=await fetch("/api/admin/sprints/meeting-conflicts",{cache:"no-store"});if(!r.ok)throw Error();const d=await r.json();setWarnings(d.warnings);}
  catch{setError(t("meetingConflicts.error"));}finally{setBusy(false);}
 }
 useEffect(()=>{void reload();},[]);
 return <section className="smn-panel p-4 mt-4">
  <h2 className="h4">{t("meetingConflicts.title")}</h2><p className="text-secondary">{t("meetingConflicts.info")}</p>
  <button className="btn btn-outline-primary mb-3" type="button" onClick={reload} disabled={busy}>{t("meetingConflicts.refresh")}</button>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {!error&&warnings.length===0&&<p role="status">{t("meetingConflicts.none")}</p>}
  {warnings.length>0&&<ul className="list-group">{warnings.map((w,i)=><li key={w.eventId+"-"+w.otherId+"-"+i} className="list-group-item">
   <strong>{w.kind==="overlap"?t("meetingConflicts.overlap"):t("meetingConflicts.closure")}</strong>
   <div>{w.eventTitle}{w.otherTitle?" ↔ "+w.otherTitle:""}{w.detail?" — "+w.detail:""}</div>
   <small className="text-secondary">{w.startAt} — {w.endAt}</small>
  </li>)}</ul>}
 </section>;
}
