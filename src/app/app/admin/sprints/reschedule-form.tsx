"use client";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
type Preview={ok:boolean;token?:string;warnings?:Array<{id:string;kind:string;startAt:string;endAt:string}>;impact?:{goalCount:number;storyPoints:unknown;initialCapacityJh:number|null;manualActualJh:number|null;recalculatedReferenceJh:number|null;missingSources:string[];initialAndManualPreserved:boolean};error?:string};
export default function RescheduleForm(){
 const t=useTranslation();const [sprintId,setSprintId]=useState(""),[startAt,setStartAt]=useState(""),[endAt,setEndAt]=useState("");
 const [preview,setPreview]=useState<Preview|null>(null),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const input=()=>({sprintId,startAt:new Date(startAt+":00Z").toISOString(),endAt:new Date(endAt+":00Z").toISOString(),mode:"keep" as const});
 async function check(){setBusy(true);setError("");setMessage("");setPreview(null);
 try{const r=await fetch("/api/admin/sprints/reschedule",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input())});const j=await r.json();if(!r.ok)throw Error(j.error);setPreview(j);}catch(e){setError(String(e));}finally{setBusy(false);}}
 async function confirm(){if(!preview?.token)return;setBusy(true);setError("");
 try{const r=await fetch("/api/admin/sprints/reschedule",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({input:input(),token:preview.token})});if(!r.ok)throw Error();setMessage(t("sprintReschedule.saved"));setPreview(null);}catch{setError(t("sprintReschedule.error"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("sprintReschedule.title")}</h2><p>{t("sprintReschedule.intro")}</p>
 <div className="d-grid gap-2"><label htmlFor="r-sprint">{t("sprintReschedule.id")}</label><input id="r-sprint" className="form-control" required value={sprintId} onChange={e=>{setSprintId(e.target.value);setPreview(null);}}/>
 <label htmlFor="r-start">{t("sprintReschedule.start")}</label><input id="r-start" type="datetime-local" className="form-control" value={startAt} onChange={e=>{setStartAt(e.target.value);setPreview(null);}}/>
 <label htmlFor="r-end">{t("sprintReschedule.end")}</label><input id="r-end" type="datetime-local" className="form-control" value={endAt} onChange={e=>{setEndAt(e.target.value);setPreview(null);}}/>
 <p>{t("sprintReschedule.keep")}</p><button className="btn btn-outline-primary" type="button" disabled={busy||!sprintId||!startAt||!endAt} onClick={check}>{t("sprintReschedule.preview")}</button></div>
 {preview?.ok&&<div className="mt-3">{preview.impact&&<div className="alert alert-info" role="status"><strong>{t("sprintReschedule.impactTitle")}</strong><ul>
 <li>{t("sprintReschedule.reviewGoals")}: {preview.impact.goalCount}</li>
 <li>{t("sprintReschedule.reviewSp")}: {preview.impact.storyPoints?t("sprintReschedule.present"):t("sprintReschedule.missing")}</li>
 <li>{t("sprintReschedule.initialRetained")}: {preview.impact.initialCapacityJh??t("sprintReschedule.missing")} JH</li>
 <li>{t("sprintReschedule.manualRetained")}: {preview.impact.manualActualJh??t("sprintReschedule.missing")} JH</li>
 <li>{t("sprintReschedule.newReference")}: {preview.impact.recalculatedReferenceJh??t("sprintReschedule.missing")} JH</li>
 </ul><p>{t("sprintReschedule.unchanged")}</p>
 {preview.impact.missingSources.length>0&&<p>{t("sprintReschedule.missingSources")}: {preview.impact.missingSources.join(", ")}</p>}</div>}<p>{t("sprintReschedule.warningCount")}: {preview.warnings?.length??0}</p>{preview.warnings?.map(x=><p key={x.id}>{x.kind} — {x.startAt} — {x.endAt}</p>)}<button className="btn btn-primary" type="button" disabled={busy} onClick={confirm}>{t("sprintReschedule.confirm")}</button><button className="btn btn-outline-secondary ms-2" type="button" onClick={()=>setPreview(null)}>{t("sprintReschedule.cancel")}</button></div>}
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}{message&&<p role="status" className="alert alert-success">{message}</p>}</section>;
}
