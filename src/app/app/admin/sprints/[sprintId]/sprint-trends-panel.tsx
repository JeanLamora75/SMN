"use client";
import {useId,useRef,useState} from "react";
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
const colors=["var(--bs-primary)","var(--bs-success)","var(--bs-info)","var(--bs-warning)","var(--bs-danger)","var(--bs-secondary)"];
export default function SprintTrendsPanel({data,locale}:{data:readonly SprintTrendPoint[]|null;locale:"fr"|"en"}){
 const uid=useId(),ref=useRef<SVGSVGElement>(null),rows=data??[];
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
 const max=Math.max(1,...valid),sum=valid.reduce((a,b)=>a+b,0);
 const unsuitable=(s:Style)=>(s==="pie"||s==="donut")&&(valid.length===0||valid.some(v=>v<0)||sum<=0)||
  s==="gauge"&&(selected.metric!=="completionRate"||valid.length===0||valid[valid.length-1]>100||valid[valid.length-1]<0);
 const points=numbers.map((v,i)=>({v,x:82+(i+.5)*786/Math.max(1,numbers.length),y:307-(v??0)/max*220}));
 const gauge=valid.length?valid[valid.length-1]:null;
 function apply(){const a=rows.findIndex(r=>r.sprintId===(from||first)),b=rows.findIndex(r=>r.sprintId===(to||last));
  if(a<0||b<a){setError(local("Plage de Sprints invalide.","Invalid Sprint range."));return;}
  setShown({metric,style,from:from||first,to:to||last});setError("");
 }
 async function savePng(){if(!ref.current)return;try{
  const original=ref.current,clone=original.cloneNode(true) as SVGSVGElement;
  const originals=original.querySelectorAll("*"),clones=clone.querySelectorAll("*");
  const computed=window.getComputedStyle(original);
  clone.setAttribute("style",`background:${computed.backgroundColor};color:${computed.color}`);
  originals.forEach((node,i)=>{const target=clones.item(i);if(!target)return;const style=window.getComputedStyle(node);
   for(const prop of ["fill","stroke"]){const val=style.getPropertyValue(prop);if(val)target.setAttribute(prop,val);}
  });
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:"image/svg+xml"}));
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement("canvas");canvas.width=1920;canvas.height=800;
  const ctx=canvas.getContext("2d");if(!ctx)throw Error("canvas");ctx.drawImage(image,0,0,1920,800);URL.revokeObjectURL(url);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)throw Error("png");
  const link=document.createElement("a"),download=URL.createObjectURL(blob);link.href=download;link.download=`tendances-${selected.metric}.png`;link.click();URL.revokeObjectURL(download);setError("");
 }catch{setError(local("Impossible d'exporter le PNG.","PNG export failed."));}}
 let angle=-Math.PI/2;
 return <section aria-label={local("Tendances","Trends")}>
  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h2 className="h5 mb-0">{local("Tendances","Trends")}</h2><button type="button" className="btn btn-outline-primary btn-sm" onClick={savePng} disabled={!valid.length||unsuitable(selected.style)}>{local("Enregistrer en PNG","Save as PNG")}</button></div>
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
  <div className="border rounded-3 p-2 p-md-3 mb-3 w-100">
   {valid.length>0&&!unsuitable(selected.style)?<svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 400" role="img" aria-label={title} className="w-100 d-block" style={{color:"var(--bs-body-color)",background:"var(--bs-body-bg)"}}>
    <title>{title}</title><rect width="960" height="400" fill="var(--bs-body-bg)"/><text x="480" y="34" textAnchor="middle" fontSize="21" fontWeight="700" fill="var(--bs-body-color)">{title}</text>
    {(["bar","line","area"] as Style[]).includes(selected.style)&&<>
     {[0,.25,.5,.75,1].map(f=><g key={f}><line x1="82" x2="868" y1={307-f*220} y2={307-f*220} stroke="var(--bs-border-color)" strokeDasharray="4 4"/><text x="72" y={312-f*220} fontSize="12" textAnchor="end" fill="var(--bs-body-color)">{fmt(f*max)}</text></g>)}
     {points.map((p,i)=><g key={range[i].sprintId}>
      {selected.style==="bar"&&p.v!==null&&<rect x={p.x-25} y={p.y} width="50" height={307-p.y} fill={colors[i%colors.length]}/>}
      {selected.style!=="bar"&&p.v!==null&&<circle cx={p.x} cy={p.y} r="5" fill="var(--bs-primary)"/>}
      {selected.style!=="bar"&&i>0&&points[i-1].v!==null&&p.v!==null&&<line x1={points[i-1].x} y1={points[i-1].y} x2={p.x} y2={p.y} stroke="var(--bs-primary)" strokeWidth="3"/>}
      <text x={p.x} y="333" fontSize="12" textAnchor="middle" fill="var(--bs-body-color)">{i+1}</text></g>)}
     <text x="480" y="360" textAnchor="middle" fill="var(--bs-secondary-color)" fontSize="13">{definition.unit} · {local("Sprints numérotés dans le tableau","Sprints numbered in the table")}</text>
    </>}
    {(selected.style==="pie"||selected.style==="donut")&&range.map((r,i)=>{const v=numbers[i];if(v===null||v<=0)return null;
     const start=angle,sweep=v/sum*2*Math.PI;angle+=sweep;const x1=480+Math.cos(start)*120,y1=195+Math.sin(start)*120,x2=480+Math.cos(angle)*120,y2=195+Math.sin(angle)*120;
     const d=sweep>Math.PI*2-0.00001?"M360 195 A120 120 0 1 0 600 195 A120 120 0 1 0 360 195":`M480 195 L${x1} ${y1} A120 120 0 ${sweep>Math.PI?1:0} 1 ${x2} ${y2} Z`;
     return <path key={r.sprintId} d={d} fill={colors[i%colors.length]}/>;})}
    {selected.style==="donut"&&<circle cx="480" cy="195" r="68" fill="var(--bs-body-bg)"/>}
    {(selected.style==="pie"||selected.style==="donut")&&range.map((r,i)=><g key={r.sprintId}><rect x={80+(i%3)*280} y={335+Math.floor(i/3)*20} width="12" height="12" fill={colors[i%colors.length]}/><text x={98+(i%3)*280} y={346+Math.floor(i/3)*20} fontSize="12" fill="var(--bs-body-color)">{r.name.slice(0,22)}</text></g>)}
    {selected.style==="gauge"&&<g><path d="M320 292 A160 160 0 0 1 640 292" fill="none" stroke="var(--bs-border-color)" strokeWidth="28"/><path d="M320 292 A160 160 0 0 1 640 292" fill="none" stroke="var(--bs-primary)" strokeWidth="28" pathLength="100" strokeDasharray={`${Math.min(100,gauge??0)} 100`}/><text x="480" y="235" textAnchor="middle" fontSize="38" fill="var(--bs-body-color)">{fmt(gauge??0)} %</text><text x="480" y="270" textAnchor="middle" fontSize="16" fill="var(--bs-secondary-color)">{range[range.length-1]?.name} · 0–100 %</text></g>}
   </svg>:<p className="text-secondary" role="status">{local("Aucune donnée exploitable pour ce graphique.","No usable chart data.")}</p>}
  </div>
  <div className="table-responsive"><table className="table table-striped"><caption className="caption-top">{title}</caption><thead><tr><th>{local("Sprint","Sprint")}</th><th>{local("Valeur","Value")}</th><th>{local("Version","Version")}</th></tr></thead><tbody>{range.map(r=><tr key={r.sprintId}><th scope="row">{r.name}</th><td>{r[selected.metric]===null?"—":fmt(r[selected.metric]!)+ " "+definition.unit}</td><td>{r.snapshotVersion??"—"}</td></tr>)}</tbody></table></div>
  </>}
 </section>;
}
