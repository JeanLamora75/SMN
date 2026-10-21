"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
type Sprint={id:string;name:string;status:string;startAt:string;endAt:string;timeZone:string};
export default function RenameSprintForm(){
 const t=useTranslation();
 const [sprints,setSprints]=useState<Sprint[]>([]);
 const [id,setId]=useState("");
 const [name,setName]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{let live=true;fetch("/api/admin/sprints/names",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(live)setSprints(d.sprints);}).catch(()=>{if(live)setError(t("sprintRename.loadError"));});return()=>{live=false;};},[t]);
 function select(value:string){setId(value);setName(sprints.find(s=>s.id===value)?.name??"");setNotice("");setError("");}
 const duplicate=sprints.some(s=>s.id!==id&&s.name.trim().toLocaleLowerCase()===name.trim().toLocaleLowerCase()&&name.trim()!=="");
 async function save(e:FormEvent){e.preventDefault();if(!id||!name.trim())return;setBusy(true);setError("");setNotice("");
 try{const r=await fetch("/api/admin/sprints/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});
 const d=await r.json();if(!r.ok)throw Error();
 setSprints(s=>s.map(x=>x.id===id?{...x,name:d.sprint.name}:x));setName(d.sprint.name);
 setNotice(t(d.duplicate?"sprintRename.savedDuplicate":"sprintRename.saved"));
 }catch{setError(t("sprintRename.saveError"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("sprintRename.title")}</h2>
 <form onSubmit={save} className="d-grid gap-3">
 <div><label className="form-label" htmlFor="rename-sprint">{t("sprintRename.select")}</label>
 <select className="form-select" id="rename-sprint" value={id} onChange={e=>select(e.target.value)}><option value="">{t("sprintRename.choose")}</option>{sprints.map(s=><option key={s.id} value={s.id}>{s.name} — {s.status} — {s.startAt.slice(0,10)}</option>)}</select></div>
 {id&&<><div><label htmlFor="rename-name" className="form-label">{t("sprintRename.name")}</label><input id="rename-name" className="form-control" maxLength={160} required value={name} onChange={e=>{setName(e.target.value);setNotice("");}} disabled={busy}/></div>
 {duplicate&&<p role="status" className="alert alert-warning">{t("sprintRename.duplicate")}</p>}
 <button type="submit" className="btn btn-primary" disabled={busy||!name.trim()}>{t("sprintRename.save")}</button></>}
 </form>{error&&<p role="alert" className="alert alert-danger mt-3">{error}</p>}{notice&&<p role="status" className="alert alert-success mt-3">{notice}</p>}
 </section>;
}
