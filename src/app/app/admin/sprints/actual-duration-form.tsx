"use client";
import {useCallback,useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useEpic4Presentation} from "./i18n-presentation";
type Kind="standard"|"custom"|"exceptional";
type Meeting={id:string;kind:Kind;sprintName:string;sprintStatus:string;plannedMinutes:number;actualMinutes:number;deltaMinutes:number;startAt:string};
export default function ActualDurationForm(){
 const t=useTranslation();const presentation=useEpic4Presentation();
 const [items,setItems]=useState<Meeting[]>([]);
 const [drafts,setDrafts]=useState<Record<string,number>>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const reload=useCallback(async()=>{setBusy(true);setError("");
 try{const r=await fetch("/api/admin/sprints/actual-duration",{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setItems(j.events);setDrafts(Object.fromEntries((j.events as Meeting[]).map(x=>[x.kind+":"+x.id,x.actualMinutes])));}
 catch{setError(t("actualDuration.error"));}finally{setBusy(false);}},[t]);
 useEffect(()=>{void Promise.resolve().then(reload);},[reload]);
 async function save(e:Meeting){setBusy(true);setError("");setNotice("");const key=e.kind+":"+e.id;
 try{const r=await fetch("/api/admin/sprints/actual-duration",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e.id,kind:e.kind,minutes:drafts[key]})});if(!r.ok)throw Error();setNotice(t("actualDuration.saved"));await reload();}
 catch{setError(t("actualDuration.error"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("actualDuration.title")}</h2><p>{t("actualDuration.info")}</p>
 <div className="table-responsive"><table className="table"><thead><tr><th>{t("actualDuration.meeting")}</th><th>{t("actualDuration.planned")}</th><th>{t("actualDuration.actual")}</th><th>{t("actualDuration.delta")}</th><th>{t("actualDuration.action")}</th></tr></thead>
 <tbody>{items.map(x=>{const key=x.kind+":"+x.id,actual=drafts[key]??x.actualMinutes;return <tr key={key}>
 <td>{x.sprintName} — {presentation.kind(x.kind)}<div className="small text-secondary">{presentation.date(x.startAt)}</div></td>
 <td>{x.plannedMinutes} min</td>
 <td><input className="form-control" type="number" aria-label={t("actualDuration.actual")} min={0} max={1440} step={1} value={actual} disabled={busy||x.sprintStatus==="closed"} onChange={e=>setDrafts({...drafts,[key]:Number(e.target.value)})}/></td>
 <td>{actual-x.plannedMinutes} min</td>
 <td><button type="button" className="btn btn-outline-primary btn-sm" disabled={busy||x.sprintStatus==="closed"||!Number.isSafeInteger(actual)||actual<0||actual>1440} onClick={()=>save(x)}>{t("actualDuration.save")}</button></td>
 </tr>;})}</tbody></table></div>
 {notice&&<p role="status" className="alert alert-success">{notice}</p>}{error&&<p role="alert" className="alert alert-warning">{error}</p>}
 </section>;
}
