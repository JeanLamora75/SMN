"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Sprint={id:string;name:string;status:string};
type Version={id:string;version:number;closedAt:string;snapshot:unknown};
export default function SprintClosure(){
 const t=useTranslation();const [sprints,setSprints]=useState<Sprint[]>([]),[selected,setSelected]=useState(""),[status,setStatus]=useState(""),[versions,setVersions]=useState<Version[]>([]),[visible,setVisible]=useState<number|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch("/api/admin/sprints/states",{cache:"no-store"}).then(r=>r.json()).then(j=>setSprints(j.sprints??[])).catch(()=>setError(t("sprintClosure.error")));},[t]);
 async function load(id:string){setSelected(id);setVersions([]);setVisible(null);setError("");if(!id)return;
 try{const r=await fetch("/api/admin/sprints/closure?sprintId="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setVersions(j.versions);setStatus(j.sprint.status);}catch{setError(t("sprintClosure.error"));}}
 async function change(action:"close"|"reopen"){if(!selected||!window.confirm(t("sprintClosure.confirm")))return;setBusy(true);setNotice("");setError("");
 try{const r=await fetch("/api/admin/sprints/closure",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sprintId:selected,action})});if(!r.ok)throw Error();setNotice(t("sprintClosure.saved"));await load(selected);}
 catch{setError(t("sprintClosure.error"));}finally{setBusy(false);}}
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("sprintClosure.title")}</h2>
 <label htmlFor="closure-sprint" className="form-label">{t("sprintClosure.choose")}</label><select id="closure-sprint" className="form-select" value={selected} onChange={e=>load(e.target.value)}><option value="">—</option>{sprints.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select>
 {selected&&<><p className="mt-3">{t("sprintClosure.status")}: {status}</p>
 {status==="finished"&&<button type="button" className="btn btn-primary" disabled={busy} onClick={()=>change("close")}>{t("sprintClosure.close")}</button>}
 {status==="closed"&&<button type="button" className="btn btn-outline-warning" disabled={busy} onClick={()=>change("reopen")}>{t("sprintClosure.reopen")}</button>}
 <h3 className="h5 mt-4">{t("sprintClosure.versions")}</h3>
 {versions.length===0&&<p>{t("sprintClosure.empty")}</p>}
 {versions.map(v=><div key={v.id} className="border-bottom py-2"><button type="button" className="btn btn-link" onClick={()=>setVisible(visible===v.version?null:v.version)}>V{v.version} — {v.closedAt}</button>{visible===v.version&&<pre className="text-wrap">{JSON.stringify(v.snapshot,null,2)}</pre>}</div>)}</>}
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}{notice&&<p role="status" className="alert alert-success">{notice}</p>}
 </section>;
}
