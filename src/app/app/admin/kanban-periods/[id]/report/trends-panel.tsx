"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {parseKanbanTrendPayload} from "@/lib/kanban-trend-payload";
type Period={id:string;name:string;startOn:string;endOn:string;started:number|null;throughput:number|null;wipFinal:number|null;cycleDays:number|null;leadDays:number|null};
function TimingChart({periods}:{periods:Period[]}){
 const lang=typeof document!=="undefined"&&document.documentElement.lang.startsWith("en")?"en":"fr";
 const format=(n:number|null)=>n===null?(lang==="fr"?"Non renseigné":"Not recorded"):new Intl.NumberFormat(lang==="fr"?"fr-FR":"en-GB",{minimumFractionDigits:1,maximumFractionDigits:1}).format(n)+(lang==="fr"?" jour":" day");
 const lines=[{key:"cycleDays" as const,label:"Cycle Time",color:"#0d6efd"},{key:"leadDays" as const,label:"Lead Time",color:"#198754"}];
 const max=Math.max(1,...periods.flatMap(p=>[p.cycleDays,p.leadDays]).filter((x):x is number=>x!==null));
 const x=(i:number)=>42+i*(510/Math.max(1,periods.length-1));
 const y=(v:number)=>165-v/max*135;
 return <section className="col-12" aria-label="Cycle Time et Lead Time moyens">
  <div className="border rounded p-3">
   <h3 className="h6">Cycle Time et Lead Time — jours calendaires</h3>
   <div className="d-flex gap-3 mb-2 flex-wrap">{lines.map(s=><span key={s.key} className="small"><span aria-hidden="true" style={{display:"inline-block",background:s.color,width:18,height:3,verticalAlign:"middle",marginRight:5}}/>{s.label}</span>)}</div>
   {periods.every(p=>p.cycleDays===null&&p.leadDays===null)?<p className="text-secondary">Aucune moyenne comparable enregistrée.</p>:
   <svg viewBox="0 0 600 195" role="img" aria-label={"Comparaison des moyennes : "+periods.map(p=>p.name+": Cycle Time "+format(p.cycleDays)+", Lead Time "+format(p.leadDays)).join("; ")} className="w-100" style={{maxHeight:290}}>
    <line x1="40" y1="165" x2="565" y2="165" stroke="currentColor" opacity=".4"/>
    {lines.map(s=><g key={s.key}>
     {periods.slice(1).map((p,i)=>{const a=periods[i][s.key],b=p[s.key];return a!==null&&b!==null?<line key={i} x1={x(i)} x2={x(i+1)} y1={y(a)} y2={y(b)} stroke={s.color} strokeWidth="2.5"/>:null;})}
     {periods.map((p,i)=>p[s.key]===null?null:<circle key={p.id} cx={x(i)} cy={y(p[s.key]!)} r="4" fill={s.color}/>)}
    </g>)}
    {periods.map((p,i)=><text key={p.id} x={x(i)} y="186" textAnchor="middle" fontSize="10" fill="currentColor">{p.startOn.slice(0,7)}</text>)}
   </svg>}
   <div className="table-responsive"><table className="table table-sm small"><thead><tr><th>Période</th><th>Cycle Time</th><th>Lead Time</th></tr></thead>
    <tbody>{periods.map(p=><tr key={p.id}><td>{p.name}</td><td>{format(p.cycleDays)}</td><td>{format(p.leadDays)}</td></tr>)}</tbody>
   </table></div>
  </div>
 </section>;
}
const series=["started","throughput","wipFinal"] as const;
export default function KanbanTrendsPanel({periodId}:{periodId:string}){
 const t=useTranslation();
 const tr=(key:string)=>t(("kanbanTrends."+key) as Parameters<typeof t>[0]);
 const [periods,setPeriods]=useState<Period[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(false);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/kanban-periods/"+encodeURIComponent(periodId)+"/trends",{
   cache:"no-store",signal:controller.signal
  }).then(async response=>{
   if(!response.ok)throw Error("unavailable");
   const parsed=parseKanbanTrendPayload(await response.json() as unknown);
   if(!parsed)throw Error("invalid");
   return parsed;
  }).then(result=>{
   if(!controller.signal.aborted){setPeriods(result);setError(false);setLoading(false);}
  }).catch(()=>{
   if(!controller.signal.aborted){setError(true);setLoading(false);}
  });
  return()=>controller.abort();
 },[periodId,retry]);
 if(loading)return <p role="status">{tr("loading")}</p>;
 if(error)return <p role="alert" className="alert alert-warning">{tr("unavailable")}{" "}
  <button type="button" className="btn btn-outline-secondary btn-sm"
   onClick={()=>{setLoading(true);setError(false);setRetry(n=>n+1);}}>{tr("retry")}</button></p>;
 if(!periods.length)return <p className="text-secondary">{tr("noPeriods")}</p>;
 return <div className="row g-3">
  {series.map(key=>{
   const label=tr(key);
   const known=periods.filter(p=>p[key]!==null);
   const max=Math.max(1,...known.map(p=>p[key]??0));
   return <section className="col-12 col-xl-4" key={key} aria-label={label}>
    <div className="border rounded p-3 h-100">
     <h3 className="h6">{label}</h3>
     <p className="small text-secondary">{tr("units")}</p>
     {!known.length?<p className="text-secondary">{tr("none")}</p>:
      <div role="img" aria-label={tr("aria").replace("{name}",label)+": "+periods.map(p=>p.name+" "+(p[key]===null?tr("unknown"):p[key])).join("; ")}>
       {periods.map(p=><div className="d-flex align-items-center gap-2 mb-2" key={p.id}>
        <span className="small text-truncate" style={{width:"38%"}} title={p.name}>{p.name}</span>
        <div style={{flex:1,minWidth:0}} className="bg-body-tertiary rounded">
         {p[key]!==null&&<div className="bg-primary rounded" style={{height:16,width:(p[key]===0?0:Math.max(2,(p[key]/max)*100))+"%"}}/>}
        </div>
        <span className="small text-end" style={{width:45}}>{p[key]===null?tr("unknown"):p[key]}</span>
       </div>)}
      </div>}
    </div>
   </section>;
  })}
  <TimingChart periods={periods}/>
 </div>;
}
