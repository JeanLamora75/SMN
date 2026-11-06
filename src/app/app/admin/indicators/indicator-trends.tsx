"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {formatIndicatorValue} from "@/lib/indicators/format-value";
import {MAX_TREND_SERIES,TREND_COLORS,trendNumbers,trendRange,trendSegments,validateTrendSelection} from "@/lib/indicators/trend-series";
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
 const [indicators,setIndicators]=useState<string[]>([]),[start,setStart]=useState(""),[end,setEnd]=useState(""),[style,setStyle]=useState<Style>("bar");
 const [applied,setApplied]=useState<{indicators:string[];start:string;end:string;style:Style}|null>(null);
 const svgRef=useRef<SVGSVGElement>(null);
 useEffect(()=>{const ctrl=new AbortController();void fetch("/api/admin/indicators/reporting?"+new URLSearchParams({teamId,cycleType,screen:"trends"}),{signal:ctrl.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Report>}).then(data=>{if(ctrl.signal.aborted)return;const range=defaultTrendRange(data.cycles,cycleId);const selected=data.columns[0]?.id??"";setReport(data);setIndicators(selected?[selected]:[]);setStart(range.start);setEnd(range.end);setStyle("bar");setApplied({indicators:selected?[selected]:[],start:range.start,end:range.end,style:"bar"});setBusy(false);setError("");}).catch(()=>{if(!ctrl.signal.aborted){setBusy(false);setError(t("indicators.reporting.unavailable"));}});return()=>ctrl.abort();},[teamId,cycleType,cycleId,t]);
 const validBounds=!!report&&report.cycles.some(c=>c.id===start)&&report.cycles.some(c=>c.id===end)&&report.cycles.findIndex(c=>c.id===start)<=report.cycles.findIndex(c=>c.id===end);
 const activeColumns=applied?.indicators.map(id=>report?.columns.find(c=>c.id===id)).filter((c):c is Column=>!!c)??[];
 const active=activeColumns[0];
 const range=useMemo(()=>{if(!report||!applied)return [];const a=report.cycles.findIndex(c=>c.id===applied.start),b=report.cycles.findIndex(c=>c.id===applied.end);return a>=0&&b>=a?report.cycles.slice(a,b+1):[];},[report,applied]);
 const series=activeColumns.map((column,i)=>({column,values:trendNumbers(range,column.id),color:TREND_COLORS[i%TREND_COLORS.length]}));
 const nums=series[0]?.values??[];
 const actual=series.flatMap(item=>item.values).filter((v):v is number=>v!==null);
 const {min,span}=trendRange(series.map(item=>item.values));
 const x=(i:number)=>80+(i+.5)*800/Math.max(1,range.length);
 const y=(v:number)=>300-(v-min)/span*215;
 const format=(v:number|null)=>formatIndicatorValue(v,locale);
 const chartTitle=active&&range.length?(activeColumns.length===1?active.name:(locale==="fr"?"Comparaison d’indicateurs":"Indicator comparison"))+" : "+range[0].name+" - "+range[range.length-1].name:"";
 const nonnegative=actual.length>0&&actual.every(v=>v>=0)&&actual.some(v=>v>0)&&actual.length===nums.length;
 const isParts=applied?.style==="pie"||applied?.style==="donut";
 const total=nums.filter((v):v is number=>v!==null).reduce((a,b)=>a+b,0);
 const colors=[...TREND_COLORS];
 const multiple=activeColumns.length>1;
 const selectionError=(code:Exclude<ReturnType<typeof validateTrendSelection>,null>)=>({
  empty:locale==="fr"?"Sélectionnez au moins un indicateur.":"Select at least one indicator.",
  limit:locale==="fr"?"Maximum 6 indicateurs par graphique.":"Maximum 6 indicators per chart.",
  unknown:locale==="fr"?"Sélection d’indicateurs invalide.":"Invalid indicator selection.",
  "mixed-unit":locale==="fr"?"Les indicateurs doivent avoir la même unité.":"Indicators must use the same unit."
 })[code];
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
   const canvas=document.createElement("canvas");canvas.width=1920;canvas.height=1180;
   const ctx=canvas.getContext("2d");if(!ctx)throw Error("canvas");
   ctx.fillStyle=getComputedStyle(document.body).backgroundColor;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)throw Error("png");
   const link=URL.createObjectURL(blob),a=document.createElement("a");a.href=link;a.download="tendances-"+(multiple?"comparaison":active?.tag??"indicateur").replace(/[^a-z0-9_-]/gi,"_")+".png";a.click();URL.revokeObjectURL(link);
  }catch{setError(t("indicators.reporting.unavailable"));}finally{if(url)URL.revokeObjectURL(url);}
 }
 return <section className="smn-panel rounded-4 p-3 my-3" aria-label={t("indicators.reporting.title")}>
  <h2 className="h5 mb-3">{t("indicators.reporting.title")}</h2>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {busy&&<p role="status">{t("indicators.reporting.loading")}</p>}
  {report&&<><form className="d-flex flex-wrap align-items-end gap-3 mb-3" onSubmit={e=>{e.preventDefault();if(!validBounds){setError(locale==="fr"?"Plage de Sprints invalide.":"Invalid cycle range.");return;}
  const failure=validateTrendSelection(indicators,report.columns);
  if(failure){setError(selectionError(failure));return;}
  const selectedStyle=indicators.length>1&&["pie","donut","gauge"].includes(style)?"line":style;
  if(selectedStyle!==style)setStyle(selectedStyle);
  setError("");setApplied({indicators:[...indicators],start,end,style:selectedStyle});}}>
   <div className="flex-grow-1" style={{minWidth:220}}>
    <span className="form-label d-block mb-1">{locale==="fr"?"Indicateurs":"Indicators"}</span>
    <details className="dropdown">
     <summary className="form-select" style={{cursor:"pointer",minHeight:38}}>
      {indicators.length===0?(locale==="fr"?"Choisir les indicateurs":"Choose indicators"):
       indicators.length===1?report.columns.find(c=>c.id===indicators[0])?.name:
       (locale==="fr"?indicators.length+" indicateurs sélectionnés":indicators.length+" indicators selected")}
     </summary>
     <div className="border rounded-3 bg-body p-3 shadow-sm mt-1" style={{position:"absolute",zIndex:5,minWidth:"min(360px,85vw)",maxHeight:280,overflowY:"auto"}}>
      <p className="small text-body-secondary mb-2">{locale==="fr"?"Jusqu’à six indicateurs de même unité":"Up to six indicators with the same unit"}</p>
      {report.columns.map(column=><label key={column.id} className="d-flex align-items-start gap-2 py-1" style={{cursor:"pointer"}}>
       <input className="form-check-input mt-1" type="checkbox" checked={indicators.includes(column.id)}
        disabled={!indicators.includes(column.id)&&(indicators.length>=MAX_TREND_SERIES||
         indicators.some(id=>report.columns.find(c=>c.id===id)?.unit.trim().toLowerCase()!==column.unit.trim().toLowerCase()))}
        onChange={e=>{setIndicators(current=>e.target.checked?[...current,column.id]:current.filter(id=>id!==column.id));}}/>
       <span className="small">{column.name} <span className="text-body-secondary">({column.unit})</span></span>
      </label>)}
     </div>
    </details>
   </div>
   <label className="form-label mb-0">{locale==="fr"?"Sprint de départ":"Start cycle"}<select className="form-select mt-1" value={start} onChange={e=>setStart(e.target.value)}>{report.cycles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label className="form-label mb-0">{locale==="fr"?"Style graphique":"Chart style"}<select className="form-select mt-1" value={style} onChange={e=>setStyle(e.target.value as Style)}>{styles.map(s=><option key={s} value={s} disabled={indicators.length>1&&["pie","donut","gauge"].includes(s)}>{({bar:locale==="fr"?"Barres":"Bars",line:locale==="fr"?"Ligne":"Line",pie:locale==="fr"?"Secteurs":"Pie",donut:locale==="fr"?"Anneau":"Donut",gauge:locale==="fr"?"Jauge":"Gauge",area:locale==="fr"?"Aire":"Area"})[s]}</option>)}</select></label>
   <label className="form-label mb-0">{locale==="fr"?"Sprint de fin":"End cycle"}<select className="form-select mt-1" value={end} onChange={e=>setEnd(e.target.value)}>{report.cycles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <button className="btn btn-primary" type="submit" disabled={indicators.length===0||!validBounds}>{locale==="fr"?"Filtrer":"Filter"}</button>
  </form>
  {report.columns.length===0&&<p role="status">{t("indicators.reporting.empty")}</p>}
  {active&&<><div className="d-flex justify-content-end mb-2"><button type="button" className="btn btn-outline-primary btn-sm" disabled={actual.length===0||isParts&&!nonnegative||applied?.style==="gauge"&&!gaugeValid} onClick={()=>void exportPng()}>{locale==="fr"?"Enregistrer en PNG":"Save as PNG"}</button></div>
   {actual.length===0?<p role="status">{t("indicators.reporting.empty")}</p>:applied?.style==="gauge"&&!gaugeValid?<p role="alert">{locale==="fr"?"La jauge nécessite une valeur finale comprise entre 0 et 100 (référence : 100).":"Gauge requires a final value between 0 and 100 (reference: 100)."}</p>:isParts&&!nonnegative?<p role="alert">{locale==="fr"?"Secteurs et anneau nécessitent des valeurs non négatives et renseignées pour chaque Sprint.":"Pie and donut need nonnegative values for every cycle."}</p>:
   <svg ref={svgRef} viewBox="0 0 960 590" className="w-100" role="img" aria-label={chartTitle} xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="960" height="590" fill="var(--bs-body-bg)"/>
    <text x="480" y="34" textAnchor="middle" fontSize="19" fill="var(--bs-body-color)">{chartTitle}</text>
    {!isParts&&applied?.style!=="gauge"&&<g>{[0,.25,.5,.75,1].map(p=><g key={p}><line x1="75" x2="885" y1={300-p*215} y2={300-p*215} stroke="var(--bs-border-color)"/><text x="67" y={304-p*215} textAnchor="end" fontSize="11" fill="var(--bs-body-color)">{format(min+p*span)}</text></g>)}
     {series.map((item,j)=>{
      const groupWidth=Math.min(66,640/Math.max(1,range.length));
      const barWidth=Math.max(2,groupWidth/Math.max(1,series.length)-2);
      const segments=trendSegments(item.values);
      return <g key={item.column.id}>
       {applied?.style==="bar"&&item.values.map((v,i)=>v===null?null:<rect key={i}
        x={x(i)-groupWidth/2+j*(groupWidth/series.length)+1} width={barWidth}
        y={Math.min(y(v),y(0))} height={Math.max(1,Math.abs(y(v)-y(0)))} fill={item.color}>
        <title>{item.column.name} — {range[i].name}: {format(v)} {item.column.unit}</title>
       </rect>)}
       {(applied?.style==="line"||applied?.style==="area")&&segments.map((part,k)=>{
        const coords=part.map(i=>({x:x(i),y:y(item.values[i]!)}));
        const line=coords.map(p=>p.x+","+p.y).join(" ");
        return <g key={k}>
         {applied?.style==="area"&&coords.length>1&&<polygon
          points={coords[0].x+","+y(0)+" "+line+" "+coords[coords.length-1].x+","+y(0)}
          fill={item.color} fillOpacity=".14"/>}
         {coords.length>1&&<polyline points={line} fill="none" stroke={item.color} strokeWidth="3"/>}
        </g>;
       })}
       {(applied?.style==="line"||applied?.style==="area")&&item.values.map((v,i)=>v===null?null:
        <circle key={i} cx={x(i)} cy={y(v)} r="4" fill={item.color} stroke="var(--bs-body-bg)" strokeWidth="1">
         <title>{item.column.name} — {range[i].name}: {format(v)} {item.column.unit}</title>
        </circle>)}
      </g>;
     })}
     {nums.map((_,i)=><text key={"label"+i} x={x(i)} y="325" transform={`rotate(-45 ${x(i)} 325)`} textAnchor="end" fontSize="11" fill="var(--bs-body-color)"><title>{range[i].name}</title>{range[i].name}</text>)}
     <text x="480" y="565" textAnchor="middle" fontSize="13" fill="var(--bs-body-color)">{active.unit}</text>
     {series.map((item,j)=><g key={item.column.id} transform={`translate(${90+(j%2)*420} ${449+Math.floor(j/2)*31})`}>
      <rect x="0" y="-11" width="22" height="11" rx="2" fill={item.color}/>
      <text x="31" y="0" fontSize="12" fill="var(--bs-body-color)">
       <title>{item.column.name} ({item.column.unit})</title>
       {item.column.name.length>39?item.column.name.slice(0,38)+"…":item.column.name} ({item.column.unit})
      </text>
     </g>)}</g>}
    {applied?.style==="gauge"&&<g><path d="M320 285 A160 160 0 0 1 640 285" stroke="var(--bs-border-color)" strokeWidth="26" fill="none"/>{last!==null&&last>=0&&last<=100&&<path d="M320 285 A160 160 0 0 1 640 285" stroke="#1b508d" strokeWidth="26" fill="none" pathLength="100" strokeDasharray={last+" 100"}/>}<text x="480" y="215" textAnchor="middle" fontSize="36" fill="var(--bs-body-color)">{format(last)} {active.unit}</text><text x="480" y="250" textAnchor="middle" fontSize="12" fill="var(--bs-body-color)">0–100</text></g>}
    {isParts&&total>0&&<g>{nums.map((v,i)=>{const before=nums.slice(0,i).reduce<number>((s,n)=>s+(n??0),0)/total;const frac=(v??0)/total;const radius=112,circ=2*Math.PI*radius;return <circle key={i} cx="480" cy="205" r={radius} fill="none" stroke={colors[i%colors.length]} strokeWidth="55" strokeDasharray={frac*circ+" "+(1-frac)*circ} strokeDashoffset={-before*circ} transform="rotate(-90 480 205)"><title>{range[i].name}: {format(v)} {active.unit}</title></circle>;})}{applied?.style==="donut"&&<circle cx="480" cy="205" r="82" fill="var(--bs-body-bg)"/>}<text x="480" y="365" textAnchor="middle" fill="var(--bs-body-color)" fontSize="13">{active.unit}</text></g>}
   </svg>}
   <div className="table-responsive mt-3"><table className="table table-sm table-striped"><thead><tr><th>{t("indicators.reporting.cycle")}</th><th>{t("indicators.reporting.status")}</th>{activeColumns.map(column=><th key={column.id} className="text-end">{column.name} ({column.unit})</th>)}</tr></thead><tbody>{range.map((c,i)=><tr key={c.id}><th>{c.name}</th><td>{c.status}</td>{series.map(item=><td key={item.column.id} className="text-end">{format(item.values[i])}</td>)}</tr>)}</tbody></table></div>
  </>}
  </>}
 </section>;
}
