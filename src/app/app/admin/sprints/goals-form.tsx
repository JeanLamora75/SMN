"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Sprint={id:string;name:string;startAt:string;endAt:string;status:string};
type Goal={id:string;title:string;evaluation:string;comment:string|null;revision:number};
const evaluation=["not_evaluated","achieved","partially_achieved","not_achieved"] as const;
export default function GoalsForm(){
 const t=useTranslation();const [sprints,setSprints]=useState<Sprint[]>([]),[sprintId,setSprintId]=useState(""),[sprint,setSprint]=useState<Sprint|null>(null),[goals,setGoals]=useState<Goal[]>([]);
 const [title,setTitle]=useState(""),[comment,setComment]=useState(""),[editing,setEditing]=useState(""),[status,setStatus]=useState<string>("not_evaluated");
 const dirty=Boolean(title.trim()||comment.trim()||editing);
 useEffect(()=>{const handler=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",handler);return ()=>window.removeEventListener("beforeunload",handler);},[dirty]);
 const [error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch("/api/admin/sprints/states").then(r=>r.json()).then(j=>setSprints(j.sprints??[])).catch(()=>setError(t("sprintGoals.error")));},[t]);
 async function load(id:string){setSprintId(id);setEditing("");setTitle("");setComment("");setStatus("not_evaluated");setSprint(null);setGoals([]);if(!id)return;
 try{const r=await fetch("/api/admin/sprints/goals?sprintId="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setSprint(j.sprint);setGoals(j.goals);}catch{setError(t("sprintGoals.error"));}}
 function edit(g:Goal){setEditing(g.id);setTitle(g.title);setComment(g.comment??"");setStatus(g.evaluation);}
 async function save(){if(!sprint||!title.trim())return;setBusy(true);setError("");setMessage("");
 try{const previous=goals.find(g=>g.id===editing);const payload={sprintId,title,evaluation:editing?status:"not_evaluated",comment,...(editing&&previous?{id:editing,revision:previous.revision}:{})};
 const r=await fetch("/api/admin/sprints/goals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if(!r.ok)throw Error();
 setMessage(t("sprintGoals.saved"));await load(sprintId);}
 catch{setError(t("sprintGoals.error"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("sprintGoals.title")}</h2>
 <label className="form-label" htmlFor="goal-sprint">{t("sprintGoals.choose")}</label><select id="goal-sprint" className="form-select" value={sprintId} onChange={e=>{if(!dirty||window.confirm(t("sprintReview.discard")))void load(e.target.value);}}><option value="">—</option>{sprints.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
 {dirty&&<p role="status" className="text-warning">{t("sprintReview.unsaved")}</p>}{sprint&&<><h3 className="h5 mt-3">{sprint.name}</h3><p>{sprint.startAt.slice(0,10)} — {sprint.endAt.slice(0,10)}</p>
 <ul className="list-group mb-3">{goals.map(g=><li key={g.id} className="list-group-item d-flex justify-content-between"><span><strong>{g.title}</strong> — {t("sprintGoals."+g.evaluation)}{g.comment&&<span className="d-block small">{g.comment}</span>}</span><button type="button" className="btn btn-outline-secondary btn-sm" disabled={sprint.status==="closed"} onClick={()=>edit(g)}>{t("sprintGoals.edit")}</button></li>)}</ul>
 <label htmlFor="goal-title" className="form-label">{t("sprintGoals.goal")}</label><input id="goal-title" className="form-control mb-2" maxLength={240} required value={title} disabled={sprint.status==="closed"} onChange={e=>setTitle(e.target.value)}/>
 {editing&&<><label htmlFor="goal-status" className="form-label">{t("sprintGoals.evaluation")}</label><select id="goal-status" className="form-select mb-2" value={status} onChange={e=>setStatus(e.target.value)}>{evaluation.map(x=><option key={x} value={x}>{t("sprintGoals."+x)}</option>)}</select></>}
 <label htmlFor="goal-comment" className="form-label">{t("sprintGoals.comment")}</label><textarea id="goal-comment" className="form-control mb-2" maxLength={2000} value={comment} disabled={sprint.status==="closed"} onChange={e=>setComment(e.target.value)}/>
 <button type="button" className="btn btn-primary" disabled={busy||sprint.status==="closed"||!title.trim()} onClick={save}>{t("sprintGoals.save")}</button></>}
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}{message&&<p role="status" className="alert alert-success">{message}</p>}
 </section>;
}
