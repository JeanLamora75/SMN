"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Column={id:string;tag:string;name:string;unit:string};
type Cycle={id:string;name:string;status:string;values:Record<string,string|null>};
type Report={columns:Column[];cycles:Cycle[]};
type Style="bar"|"line"|"pie"|"donut"|"gauge"|"area";
const styles:Style[]=["bar","line","pie","donut","gauge","area"];
export function defaultTrendRange(cycles:readonly Cycle[],currentId?:string){
 const end=Math.max(0,currentId?cycles.findIndex(c=>c.id===currentId):cycles.length-1);
 const last=currentId&&cycles.findIndex(c=>c.id===currentId)<0?Math.max(0,cycles.length-1):end;
 return {start:cycles[Math.max(0,last-5)]?.id??"",end:cycles[last]?.id??""};
}
export default function IndicatorTrends({teamId,cycleType,cycleId,locale}:{teamId:string;cycleType:"scrum"|"kanban";cycleId?:string;locale:"fr"|"en"}){
 const t=useTranslation(),[report,setReport]=useState<Report|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(true);
 const [indicator,setIndicator]=useState(""),[start,setStart]=useState(""),[end,setEnd]=useState(""),[style,setStyle]=useState<Style>("bar");
 const [applied,setApplied]=useState<{indicator:string;start:string;end:string;style:Style}|null>(null);
 const svgRef=useRef<SVGSVGElement>(null);
 useEffect(()=>{const ctrl=new AbortController();void fetch("/api/admin/indicators/reporting?"+new URLSearchParams({teamId,cycleType,screen:"trends"}),{signal:ctrl.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Report>}).then(data=>{if(ctrl.signal.aborted)return;const range=defaultTrendRange(data.cycles,cycleId);const selected=data.columns[0]?.id??"";setReport(data);setIndicator(selected);setStart(range.start);setEnd(range.end);setStyle("bar");setApplied({indicator:selected,start:range.start,end:range.end,style:"bar"});setBusy(false);setError("");}).catch(()=>{if(!ctrl.signal.aborted){setBusy(false);setError(t("indicators.reporting.unavailable"));}});return()=>ctrl.abort();},[teamId,cycleType,cycleId,t]);
 const validBounds=!!report&&report.cycles.some(c=>c.id===start)&&report.cycles.some(c=>c.id===end)&&report.cycles.findIndex(c=>c.id===start)<=report.cycles.findIndex(c=>c.id===end);
 const active=report?.columns.find(c=>c.id===applied?.indicator);
 const range=useMemo(()=>{if(!report||!applied)return [];const a=report.cycles.findIndex(c=>c.id===applied.start),b=report.cycles.findIndex(c=>c.id===applied.end);return a>=0&&b>=a?report.cycles.slice(a,b+1):[];},[report,applied]);
 const nums=range.map(c=>{const raw=active?c.values[active.id]:null;return raw!==null&&raw!==undefined&&raw!==""&&Number.isFinite(Number(raw))?Number(raw):null;});
 const actual=nums.filter((v):v is number=>v!==null);
 const min=Math.min(0,...actual),max=Math.max(1,...actual),span=Math.max(.000001,max-min);
 const x=(i:number)=>80+(i+.5)*800/Math.max(1,range.length);
 const y=(v:number)=>300-(v-min)/span*215;
 const format=(v:number|null)=>v===null?"—":new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{maximumFractionDigits:3}).format(v);
 const chartTitle=active&&range.length?active.name+" : "+range[0].name+" - "+range[range.length-1].name:"";
 const nonnegative=actual.length>0&&actual.every(v=>v>=0)&&actual.some(v=>v>0)&&actual.length===nums.length;
 const isParts=applied?.style==="pie"||applied?.style==="donut";
 const total=actual.reduce((a,b)=>a+b,0);
 const colors=["#1b508d","#6d5faf","#159895","#dc8a36","#ab4b6e","#5474a5","#7a8a35","#b35252"];
 const last=nums.length?nums[nums.length-1]:null;
 const gaugeValid=last!==null&&last>=0&&last<=100;
 async function exportPng(){
  if(!svgRef.current)return;
  let url="";
  try{
   const svg=svgRef.current.cloneNode(true) as SVGSVGElement;
   svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
   const nodes=svg.querySelectorAll<SVGElement>("[fill],[stroke]");
   nodes.forEach(node=>{for(const key of ["fill","stroke"]){const v=node.getAttribute(key);if(v?.startsWith("var(")){const fallback=key==="fill"?"#172b4d":"#a5afbd";node.setAttribute(key,fallback);}}});
   url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml"}));
   const image=new Image();image.src=url;await image.decode();
   const canvas=document.createElement("canvas");canvas.width=1920;canvas.height=760;
   const ctx=canvas.getContext("2d");if(!ctx)throw Error("canvas");
   ctx.fillStyle=getComputedStyle(document.body).backgroundColor;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)throw Error("png");
   const link=URL.createObjectURL(blob),a=document.createElement("a");a.href=link;a.download="tendances-"+(active?.tag??"indicateur").replace(/[^a-z0-9_-]/gi,"_")+".png";a.click();URL.revokeObjectURL(link);
  }catch{setError(t("indicators.reporting.unavailable"));}finally{if(url)URL.revokeObjectURL(url);}
 }
 return <section className="smn-panel rounded-4 p-3 my-3" aria-label={t("indicators.reporting.title")}>
  <h2 className="h5 mb-3">{t("indicators.reporting.title")}</h2>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {busy&&<p role="status">{t("indicators.reporting.loading")}</p>}
  {report&&<><form className="d-flex flex-wrap align-items-end gap-3 mb-3" onSubmit={e=>{e.preventDefault();if(!validBounds){setError(locale==="fr"?"Plage de Sprints invalide.":"Invalid cycle range.");return;}setError("");setApplied({indicator,start,end,style});}}>
   <label className="form-label mb-0 flex-grow-1">{t("indicators.reporting.indicator")}<select className="form-select mt-1" value={indicator} onChange={e=>setIndicator(e.target.value)}>{report.columns.map(c=><option key={c.id} value={c.id}>{c.name} ({c.unit})</option>)}</select></label>
   <label className="form-label mb-0">{locale==="fr"?"Sprint de départ":"Start cycle"}<select className="form-select mt-1" value={start} onChange={e=>setStart(e.target.value)}>{report.cycles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label className="form-label mb-0">{locale==="fr"?"Style graphique":"Chart style"}<select className="form-select mt-1" value={style} onChange={e=>setStyle(e.target.value as Style)}>{styles.map(s=><option key={s} value={s}>{({bar:locale==="fr"?"Barres":"Bars",line:locale==="fr"?"Ligne":"Line",pie:locale==="fr"?"Secteurs":"Pie",donut:locale==="fr"?"Anneau":"Donut",gauge:locale==="fr"?"Jauge":"Gauge",area:locale==="fr"?"Aire":"Area"})[s]}</option>)}</select></label>
   <label className="form-label mb-0">{locale==="fr"?"Sprint de fin":"End cycle"}<select className="form-select mt-1" value={end} onChange={e=>setEnd(e.target.value)}>{report.cycles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <button className="btn btn-primary" type="submit" disabled={!indicator||!validBounds}>{locale==="fr"?"Filtrer":"Filter"}</button>
  </form>
  {report.columns.length===0&&<p role="status">{t("indicators.reporting.empty")}</p>}
  {active&&<><div className="d-flex justify-content-end mb-2"><button type="button" className="btn btn-outline-primary btn-sm" disabled={actual.length===0||isParts&&!nonnegative||applied?.style==="gauge"&&!gaugeValid} onClick={()=>void exportPng()}>{locale==="fr"?"Enregistrer en PNG":"Save as PNG"}</button></div>
   {actual.length===0?<p role="status">{t("indicators.reporting.empty")}</p>:applied?.style==="gauge"&&!gaugeValid?<p role="alert">{locale==="fr"?"La jauge nécessite une valeur finale comprise entre 0 et 100 (référence : 100).":"Gauge requires a final value between 0 and 100 (reference: 100)."}</p>:isParts&&!nonnegative?<p role="alert">{locale==="fr"?"Secteurs et anneau nécessitent des valeurs non négatives et renseignées pour chaque Sprint.":"Pie and donut need nonnegative values for every cycle."}</p>:
   <svg ref={svgRef} viewBox="0 0 960 380" className="w-100" role="img" aria-label={chartTitle} xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="960" height="380" fill="var(--bs-body-bg)"/>
    <text x="480" y="34" textAnchor="middle" fontSize="19" fill="var(--bs-body-color)">{chartTitle}</text>
    {!isParts&&applied?.style!=="gauge"&&<g>{[0,.25,.5,.75,1].map(p=><g key={p}><line x1="75" x2="885" y1={300-p*215} y2={300-p*215} stroke="var(--bs-border-color)"/><text x="67" y={304-p*215} textAnchor="end" fontSize="11" fill="var(--bs-body-color)">{format(min+p*span)}</text></g>)}
     {nums.map((v,i)=>v===null?null:<g key={i}>
      {applied?.style==="bar"?<rect x={x(i)-Math.min(28,320/Math.max(1,range.length))} width={Math.min(56,640/Math.max(1,range.length))} y={Math.min(y(v),y(0))} height={Math.max(1,Math.abs(y(v)-y(0)))} fill="#1b508d"/>:<circle cx={x(i)} cy={y(v)} r="4" fill="#1b508d"/>}
      <title>{range[i].name}: {format(v)} {active.unit}</title></g>)}
     {(applied?.style==="line"||applied?.style==="area")&&nums.map((v,i)=>i&&v!==null&&nums[i-1]!==null?<line key={"l"+i} x1={x(i-1)} y1={y(nums[i-1]!)} x2={x(i)} y2={y(v)} stroke="#1b508d" strokeWidth="3"/>:null)}
     {nums.map((_,i)=><text key={"label"+i} x={x(i)} y="325" textAnchor="middle" fontSize="11" fill="var(--bs-body-color)">{range[i].name}</text>)}
     <text x="480" y="358" textAnchor="middle" fontSize="13" fill="var(--bs-body-color)">{active.unit}</text></g>}
    {applied?.style==="gauge"&&<g><path d="M320 285 A160 160 0 0 1 640 285" stroke="var(--bs-border-color)" strokeWidth="26" fill="none"/>{last!==null&&last>=0&&last<=100&&<path d="M320 285 A160 160 0 0 1 640 285" stroke="#1b508d" strokeWidth="26" fill="none" pathLength="100" strokeDasharray={last+" 100"}/>}<text x="480" y="215" textAnchor="middle" fontSize="36" fill="var(--bs-body-color)">{format(last)} {active.unit}</text><text x="480" y="250" textAnchor="middle" fontSize="12" fill="var(--bs-body-color)">0–100</text></g>}
    {isParts&&total>0&&<g>{nums.map((v,i)=>{const before=nums.slice(0,i).reduce<number>((s,n)=>s+(n??0),0)/total;const frac=(v??0)/total;const radius=112,circ=2*Math.PI*radius;return <circle key={i} cx="480" cy="205" r={radius} fill="none" stroke={colors[i%colors.length]} strokeWidth="55" strokeDasharray={frac*circ+" "+(1-frac)*circ} strokeDashoffset={-before*circ} transform="rotate(-90 480 205)"><title>{range[i].name}: {format(v)} {active.unit}</title></circle>;})}{applied?.style==="donut"&&<circle cx="480" cy="205" r="82" fill="var(--bs-body-bg)"/>}<text x="480" y="365" textAnchor="middle" fill="var(--bs-body-color)" fontSize="13">{active.unit}</text></g>}
   </svg>}
   <div className="table-responsive mt-3"><table className="table table-sm table-striped"><thead><tr><th>{t("indicators.reporting.cycle")}</th><th>{t("indicators.reporting.status")}</th><th className="text-end">{active.name} ({active.unit})</th></tr></thead><tbody>{range.map((c,i)=><tr key={c.id}><th>{c.name}</th><td>{c.status}</td><td className="text-end">{format(nums[i])}</td></tr>)}</tbody></table></div>
  </>}
  </>}
 </section>;
}
