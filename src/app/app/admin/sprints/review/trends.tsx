"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Sprint={id:string;name:string};
type Point={sprintId:string;name:string;completedSp:number|null;completionRate:number|null;actualCapacityJh:number|null};
const metrics=["completedSp","completionRate","actualCapacityJh"] as const;
export default function SprintTrends(){
 const t=useTranslation();const [sprints,setSprints]=useState<Sprint[]>([]),[sprintId,setSprintId]=useState(""),[points,setPoints]=useState<Point[]>([]),[error,setError]=useState("");
 useEffect(()=>{fetch("/api/admin/sprints/states",{cache:"no-store"}).then(r=>r.json()).then(d=>setSprints(d.sprints??[])).catch(()=>setError(t("sprintTrends.error")));},[t]);
 async function change(id:string){setSprintId(id);setPoints([]);setError("");if(!id)return;
 try{const r=await fetch("/api/admin/sprints/trends?sprintId="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok)throw Error();setPoints((await r.json()).points);}
 catch{setError(t("sprintTrends.error"));}}
 const display=(value:number|null,metric:string)=>value===null?t("sprintTrends.missing"):String(value)+(metric==="completionRate"?" %":metric==="actualCapacityJh"?" JH":" SP");
 return <section className="smn-panel p-4 mt-4"><h2 className="h4">{t("sprintTrends.title")}</h2><p className="text-secondary">{t("sprintTrends.info")}</p>
 <label htmlFor="trend-sprint" className="form-label">{t("sprintTrends.choose")}</label>
 <select id="trend-sprint" className="form-select" value={sprintId} onChange={e=>change(e.target.value)}><option value="">—</option>{sprints.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
 {sprintId&&points.length===0&&!error&&<p className="mt-3">{t("sprintTrends.empty")}</p>}
 {metrics.map(metric=>points.length>0?<div key={metric} className="mt-4"><h3 className="h6">{t("sprintTrends."+metric)}</h3>
 <div className="table-responsive"><table className="table table-sm"><thead><tr>{points.map(p=><th key={p.sprintId} scope="col">{p.name}</th>)}</tr></thead><tbody><tr>{points.map(p=><td key={p.sprintId}>{display(p[metric],metric)}</td>)}</tr></tbody></table></div>
 </div>:null)}
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}
 </section>;
}
