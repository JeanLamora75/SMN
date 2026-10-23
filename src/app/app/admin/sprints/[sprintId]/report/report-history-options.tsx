"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Point={sprintId:string;name:string;endAt:string;completedSp:number|null;completionRate:number|null;actualCapacityJh:number|null;snapshotVersion:number|null};
export default function ReportHistoryOptions({sprintId}:{sprintId:string}){
 const t=useTranslation(),tr=(key:string)=>t(("reportHistory."+key) as Parameters<typeof t>[0]);
 const [depth,setDepth]=useState(5),[base,setBase]=useState(5),[revision,setRevision]=useState<number|null>(null);
 const [trends,setTrends]=useState<Point[]>([]),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const dirty=revision!==null&&depth!==base;
 useUnsavedChanges(dirty||busy,tr("leaveWarning"));
 useEffect(()=>{const ctrl=new AbortController();void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/history",{cache:"no-store",signal:ctrl.signal})
 .then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{depth:number;revision:number;trends:Point[]}>;})
 .then(d=>{if(!ctrl.signal.aborted){setDepth(d.depth);setBase(d.depth);setRevision(d.revision);setTrends(d.trends);}})
 .catch(()=>{if(!ctrl.signal.aborted)setError(true);});return()=>ctrl.abort();},[sprintId]);
 async function save(){if(revision===null||busy)return;setBusy(true);setError(false);
 try{const response=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/history",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({depth,revision})});
 if(!response.ok)throw Error();
 const r=await fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/history",{cache:"no-store"});if(!r.ok)throw Error();
 const d=await r.json() as {depth:number;revision:number;trends:Point[]};setDepth(d.depth);setBase(d.depth);setRevision(d.revision);setTrends(d.trends);
 }catch{setError(true);}finally{setBusy(false);}}
 const displayed=trends.slice(-depth);
 const value=(x:number|null,unit:string)=>x===null?tr("missing"):String(x)+" "+unit;
 return <section className="border-top pt-3"><h2 className="h5">{tr("heading")}</h2>
 <p className="text-secondary">{tr("intro")}</p>
 <label htmlFor="report-history-depth">{tr("depth")}</label>
 <select className="form-select w-auto my-2" id="report-history-depth" value={depth} disabled={revision===null||busy}
 onChange={e=>setDepth(Number(e.target.value))}>{[1,2,3,4,5].map(n=><option value={n} key={n}>{n}</option>)}</select>
 <button type="button" className="btn btn-primary mb-3" disabled={!dirty||busy} onClick={()=>void save()}>{tr("save")}</button>
 {error&&<p role="alert" className="text-danger">{tr("error")}</p>}
 <h3 className="h6">{tr("preview")}</h3>
 {displayed.length===0?<p>{tr("empty")}</p>:<div className="table-responsive"><table className="table table-sm">
 <thead><tr><th>{tr("cycle")}</th><th>SP</th><th>%</th><th>JH</th></tr></thead>
 <tbody>{displayed.map(p=><tr key={p.sprintId}><td>{p.name}</td><td>{value(p.completedSp,"SP")}</td>
 <td>{value(p.completionRate,"%")}</td><td>{value(p.actualCapacityJh,"JH")}</td></tr>)}</tbody></table></div>}
 </section>;
}
