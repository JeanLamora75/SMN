"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Points={initial:number|null;added:number|null;removed:number|null;done:number|null};
type Sprint={id:string;name:string;status:string};
const empty:Points={initial:null,added:null,removed:null,done:null};
const fields=["initial","added","removed","done"] as const;
function derived(p:Points){
 const final=p.initial!==null&&p.added!==null&&p.removed!==null?p.initial+p.added-p.removed:null;
 return {final,remaining:final!==null&&p.done!==null?final-p.done:null,rate:final!==null&&final>0&&p.done!==null?p.done/final*100:null,overrun:final!==null&&final>0&&p.done!==null&&p.done>final};
}
export default function StoryPointsForm(){
 const t=useTranslation();
 const [sprints,setSprints]=useState<Sprint[]>([]),[sprintId,setSprintId]=useState(""),[status,setStatus]=useState(""),[points,setPoints]=useState<Points>(empty),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{fetch("/api/admin/sprints/states",{cache:"no-store"}).then(r=>r.json()).then(j=>setSprints(j.sprints??[])).catch(()=>setError(t("storyPoints.error")));},[t]);
 async function choose(id:string){setSprintId(id);setError("");setNotice("");setPoints(empty);setSavedPoints(empty);setRevision(0);setStatus("");if(!id)return;
 try{const r=await fetch("/api/admin/sprints/story-points?sprintId="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setPoints(j.points);setSavedPoints(j.points);setRevision(j.revision);setStatus(j.sprint.status);}
 catch{setError(t("storyPoints.error"));}}
 async function save(){setBusy(true);setError("");setNotice("");try{const r=await fetch("/api/admin/sprints/story-points",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({sprintId,revision,points})});if(!r.ok)throw Error();await choose(sprintId);setNotice(t("storyPoints.saved"));}
 catch{setError(t("storyPoints.error"));}finally{setBusy(false);}}
 const [savedPoints,setSavedPoints]=useState<Points>(empty);
 const dirty=JSON.stringify(points)!==JSON.stringify(savedPoints);
 useEffect(()=>{const handler=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",handler);return ()=>window.removeEventListener("beforeunload",handler);},[dirty]);
 const calc=derived(points);
 const value=(n:number|null)=>n===null?t("storyPoints.notCalculable"):String(n);
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("storyPoints.title")}</h2><p>{t("storyPoints.intro")}</p>
 <label className="form-label" htmlFor="sp-sprint">{t("storyPoints.sprint")}</label><select id="sp-sprint" className="form-select" value={sprintId} onChange={e=>{if(!dirty||window.confirm(t("sprintReview.discard")))void choose(e.target.value);}}><option value="">—</option>{sprints.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
 {dirty&&<p role="status" className="text-warning">{t("sprintReview.unsaved")}</p>}{sprintId&&<><div className="row g-3 mt-2">{fields.map(field=><div className="col-md-6" key={field}><label className="form-label" htmlFor={"sp-"+field}>{t(({initial:"storyPoints.initial",added:"storyPoints.added",removed:"storyPoints.removed",done:"storyPoints.done"} as const)[field])}</label><input id={"sp-"+field} className="form-control" type="number" min={0} max={1000000000} step={1} disabled={busy||status==="closed"} value={points[field]??""} onChange={e=>setPoints({...points,[field]:e.target.value===""?null:Number(e.target.value)})}/></div>)}</div>
 <dl className="mt-3"><dt>{t("storyPoints.final")}</dt><dd>{value(calc.final)}</dd><dt>{t("storyPoints.remaining")}</dt><dd>{value(calc.remaining)}</dd><dt>{t("storyPoints.rate")}</dt><dd>{calc.rate===null?t("storyPoints.notCalculable"):String(calc.rate)+" %"}</dd></dl>
 {calc.overrun&&<p role="status" className="alert alert-warning">{t("storyPoints.overrun")}</p>}
 <p className="text-secondary small">{t("storyPoints.provisional")}</p>
 <button type="button" className="btn btn-primary" disabled={busy||status==="closed"} onClick={save}>{t("storyPoints.save")}</button></>}
 {error&&<p role="alert" className="alert alert-danger">{error}</p>}{notice&&<p role="status" className="alert alert-success">{notice}</p>}
 </section>;
}
