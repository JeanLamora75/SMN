"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Sprint={id:string;name:string;status:string;startAt:string;endAt:string;timeZone:string};
type Preview={sprints:Array<{id:string;name:string;startAt:string;endAt:string;status:string}>;consequences:string[]};
export default function DeleteSprintForm(){
 const t=useTranslation();
 const [rows,setRows]=useState<Sprint[]>([]);
 const [ids,setIds]=useState<string[]>([]);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function load(){
  try{const r=await fetch("/api/admin/sprints/names",{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setRows(j.sprints);}
  catch{setError(t("sprintDelete.error"));}
 }
 useEffect(()=>{void Promise.resolve().then(load);},[]);
 function toggle(id:string){setIds(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);setPreview(null);setNotice("");setError("");}
 async function requestPreview(){setBusy(true);setError("");setPreview(null);
  try{const r=await fetch("/api/admin/sprints/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids})});
   const j=await r.json();if(!r.ok){setError(t("sprintDelete.refused"));return;}setPreview(j);
  }catch{setError(t("sprintDelete.error"));}finally{setBusy(false);}
 }
 async function confirm(){if(!preview||busy)return;setBusy(true);setError("");
  try{const r=await fetch("/api/admin/sprints/delete",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids})});
   const j=await r.json();if(!r.ok){setPreview(null);setError(t("sprintDelete.refused"));return;}
   setNotice(t("sprintDelete.done",{count:j.deleted}));setPreview(null);setIds([]);await load();
  }catch{setError(t("sprintDelete.error"));setPreview(null);}finally{setBusy(false);}
 }
 return <section className="smn-panel p-4 mt-4">
  <h2 className="h4">{t("sprintDelete.title")}</h2><p>{t("sprintDelete.intro")}</p>
  <div className="d-grid gap-2">{rows.filter(s=>s.status==="planned"&&Date.parse(s.startAt)>Date.now()).map(s=><label key={s.id} className="form-check">
   <input className="form-check-input" type="checkbox" checked={ids.includes(s.id)} onChange={()=>toggle(s.id)} disabled={busy}/>
   <span className="form-check-label">{s.name} — {s.startAt.slice(0,10)}</span>
  </label>)}</div>
  <button type="button" className="btn btn-outline-danger mt-3" disabled={ids.length===0||busy} onClick={requestPreview}>{t("sprintDelete.review")}</button>
  {preview&&<div className="alert alert-warning mt-3" role="dialog" aria-modal="true" aria-label={t("sprintDelete.confirmTitle")}>
   <h3 className="h5">{t("sprintDelete.confirmTitle")}</h3>
   <ul>{preview.sprints.map(s=><li key={s.id}>{s.name} ({s.startAt.slice(0,10)} — {s.endAt.slice(0,10)})</li>)}</ul>
   <p>{t("sprintDelete.consequences")}</p>
   <p>{t("sprintDelete.explanation")}</p>
   <div className="d-flex gap-2"><button type="button" className="btn btn-danger" onClick={confirm} disabled={busy}>{t("sprintDelete.confirm")}</button>
   <button type="button" className="btn btn-secondary" onClick={()=>setPreview(null)} disabled={busy}>{t("sprintDelete.cancel")}</button></div>
  </div>}
  {error&&<p role="alert" className="alert alert-danger mt-3">{error}</p>}
  {notice&&<p role="status" className="alert alert-success mt-3">{notice}</p>}
 </section>;
}
