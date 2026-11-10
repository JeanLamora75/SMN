"use client";
import {useId,useState} from "react";
import SharedTrendChart from "../../indicators/shared-trend-chart";
import type {SprintTrendPoint} from "@/server/sprints/trends";
type Metric="completedSp"|"completionRate"|"actualCapacityJh";
type Style="bar"|"line"|"area"|"pie"|"donut"|"gauge";
const metrics:{id:Metric;fr:string;en:string;unit:string}[]=[
 {id:"completedSp",fr:"Story Points terminés",en:"Completed Story Points",unit:"SP"},
 {id:"completionRate",fr:"Taux de réalisation",en:"Completion rate",unit:"%"},
 {id:"actualCapacityJh",fr:"Capacité réelle",en:"Actual capacity",unit:"J/H"}];
const styles:{id:Style;fr:string;en:string}[]=[
 {id:"bar",fr:"Barres",en:"Bars"},{id:"line",fr:"Ligne",en:"Line"},{id:"area",fr:"Aire",en:"Area"},
 {id:"pie",fr:"Secteurs",en:"Pie"},{id:"donut",fr:"Anneau",en:"Donut"},{id:"gauge",fr:"Jauge",en:"Gauge"}];
export default function SprintTrendsPanel({data,locale}:{data:readonly SprintTrendPoint[]|null;locale:"fr"|"en"}){
 const uid=useId(),rows=data??[];
 const [metric,setMetric]=useState<Metric>("completedSp"),[style,setStyle]=useState<Style>("bar");
 const [from,setFrom]=useState(""),[to,setTo]=useState("");
 const [shown,setShown]=useState<{metric:Metric;style:Style;from:string;to:string}|null>(null);
 const [error,setError]=useState("");
 const local=(fr:string,en:string)=>locale==="fr"?fr:en;
 const first=rows[0]?.sprintId??"",last=rows[rows.length-1]?.sprintId??"";
 const selected=shown??{metric,style,from:from||first,to:to||last};
 const fromIndex=rows.findIndex(r=>r.sprintId===selected.from),toIndex=rows.findIndex(r=>r.sprintId===selected.to);
 const range=fromIndex>=0&&toIndex>=fromIndex?rows.slice(fromIndex,toIndex+1):[];
 const definition=metrics.find(m=>m.id===selected.metric)??metrics[0];
 const title=`${local(definition.fr,definition.en)} : ${range[0]?.name??"—"} - ${range[range.length-1]?.name??"—"}`;
 const numbers=range.map(r=>r[selected.metric]),valid=numbers.filter((v):v is number=>v!==null&&Number.isFinite(v));
 const fmt=(n:number)=>new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{maximumFractionDigits:2}).format(n);
 const sum=valid.reduce((a,b)=>a+b,0);
 const unsuitable=(s:Style)=>(s==="pie"||s==="donut")&&(valid.length===0||valid.some(v=>v<0)||sum<=0)||
  s==="gauge"&&(selected.metric!=="completionRate"||valid.length===0||valid[valid.length-1]>100||valid[valid.length-1]<0);
 function apply(){const a=rows.findIndex(r=>r.sprintId===(from||first)),b=rows.findIndex(r=>r.sprintId===(to||last));
  if(a<0||b<a){setError(local("Plage de Sprints invalide.","Invalid Sprint range."));return;}
  setShown({metric,style,from:from||first,to:to||last});setError("");
 }
 return <section aria-label={local("Tendances","Trends")}>
  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h2 className="h5 mb-0">{local("Tendances","Trends")}</h2></div>
  {data===null?<div className="alert alert-warning">{local("Tendances indisponibles","Trends unavailable")}</div>:rows.length===0?<div className="alert alert-secondary">{local("Aucune clôture disponible","No closure snapshots available")}</div>:<>
  <form className="border rounded-3 p-3 mb-3" onSubmit={event=>{event.preventDefault();apply();}}>
   <div className="row g-2 align-items-end">
    <div className="col-12 col-lg"><label htmlFor={uid+"metric"} className="form-label small">{local("Indicateur","Metric")}</label><select id={uid+"metric"} className="form-select form-select-sm" value={metric} onChange={e=>setMetric(e.target.value as Metric)}>{metrics.map(m=><option key={m.id} value={m.id}>{local(m.fr,m.en)}</option>)}</select></div>
    <div className="col-12 col-lg"><label htmlFor={uid+"from"} className="form-label small">{local("Sprint de départ","Start Sprint")}</label><select id={uid+"from"} className="form-select form-select-sm" value={from||first} onChange={e=>setFrom(e.target.value)}>{rows.map(r=><option key={r.sprintId} value={r.sprintId}>{r.name}</option>)}</select></div>
    <div className="col-12 col-lg"><label htmlFor={uid+"style"} className="form-label small">{local("Style graphique","Chart style")}</label><select id={uid+"style"} className="form-select form-select-sm" value={style} onChange={e=>setStyle(e.target.value as Style)}>{styles.map(s=><option key={s.id} value={s.id}>{local(s.fr,s.en)}</option>)}</select></div>
    <div className="col-12 col-lg"><label htmlFor={uid+"to"} className="form-label small">{local("Sprint de fin","End Sprint")}</label><select id={uid+"to"} className="form-select form-select-sm" value={to||last} onChange={e=>setTo(e.target.value)}>{rows.map(r=><option key={r.sprintId} value={r.sprintId}>{r.name}</option>)}</select></div>
    <div className="col-12 col-lg-auto"><button type="submit" className="btn btn-primary btn-sm w-100">{local("Filtrer","Filter")}</button></div>
   </div>
  </form>
  {error&&<div className="alert alert-warning" role="alert">{error}</div>}
  {unsuitable(selected.style)?<div className="alert alert-info">{local("Style incompatible avec les valeurs sélectionnées.","Selected values are incompatible with this chart style.")}</div>:null}
  {valid.length>0&&!unsuitable(selected.style)?
   <SharedTrendChart payload={{
    type:selected.style,locale,
    cycles:["pie","donut"].includes(selected.style)?[{name:range[range.length-1]?.name??""}]:range.map(r=>({name:r.name})),
    series:["pie","donut"].includes(selected.style)?
     range.map((r,i)=>({name:r.name,unit:definition.unit,values:[numbers[i]]})):
     [{name:local(definition.fr,definition.en),unit:definition.unit,values:numbers}]
   }} downloadName={"tendances-"+selected.metric}/>:
   <p className="text-secondary" role="status">{local("Aucune donnée exploitable pour ce graphique.","No usable chart data.")}</p>}
  <div className="table-responsive"><table className="table table-striped"><caption className="caption-top">{title}</caption><thead><tr><th>{local("Sprint","Sprint")}</th><th>{local("Valeur","Value")}</th><th>{local("Version","Version")}</th></tr></thead><tbody>{range.map(r=><tr key={r.sprintId}><th scope="row">{r.name}</th><td>{r[selected.metric]===null?"—":fmt(r[selected.metric]!)+ " "+definition.unit}</td><td>{r.snapshotVersion??"—"}</td></tr>)}</tbody></table></div>
  </>}
 </section>;
}
