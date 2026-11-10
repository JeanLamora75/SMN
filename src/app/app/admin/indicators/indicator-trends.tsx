"use client";
import {useEffect,useMemo,useState} from "react";
import SharedTrendChart from "./shared-trend-chart";
import {useTranslation} from "@/i18n/client";
import {formatIndicatorValue} from "@/lib/indicators/format-value";
import {MAX_TREND_SERIES,trendNumbers,validateTrendSelection} from "@/lib/indicators/trend-series";
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
 useEffect(()=>{const ctrl=new AbortController();void fetch("/api/admin/indicators/reporting?"+new URLSearchParams({teamId,cycleType,screen:"trends"}),{signal:ctrl.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Report>}).then(data=>{if(ctrl.signal.aborted)return;const range=defaultTrendRange(data.cycles,cycleId);const selected=data.columns[0]?.id??"";setReport(data);setIndicators(selected?[selected]:[]);setStart(range.start);setEnd(range.end);setStyle("bar");setApplied({indicators:selected?[selected]:[],start:range.start,end:range.end,style:"bar"});setBusy(false);setError("");}).catch(()=>{if(!ctrl.signal.aborted){setBusy(false);setError(t("indicators.reporting.unavailable"));}});return()=>ctrl.abort();},[teamId,cycleType,cycleId,t]);
 const validBounds=!!report&&report.cycles.some(c=>c.id===start)&&report.cycles.some(c=>c.id===end)&&report.cycles.findIndex(c=>c.id===start)<=report.cycles.findIndex(c=>c.id===end);
 const activeColumns=applied?.indicators.map(id=>report?.columns.find(c=>c.id===id)).filter((c):c is Column=>!!c)??[];
 const active=activeColumns[0];
 const range=useMemo(()=>{if(!report||!applied)return [];const a=report.cycles.findIndex(c=>c.id===applied.start),b=report.cycles.findIndex(c=>c.id===applied.end);return a>=0&&b>=a?report.cycles.slice(a,b+1):[];},[report,applied]);
 const series=activeColumns.map(column=>({column,values:trendNumbers(range,column.id)}));
 const nums=series[0]?.values??[];
 const actual=series.flatMap(item=>item.values).filter((v):v is number=>v!==null);
 const format=(value:number|null)=>formatIndicatorValue(value,locale);
 const nonnegative=actual.length>0&&actual.every(v=>v>=0)&&actual.some(v=>v>0)&&actual.length===nums.length;
 const isParts=applied?.style==="pie"||applied?.style==="donut";
 const multiple=activeColumns.length>1;
 const selectionError=(code:Exclude<ReturnType<typeof validateTrendSelection>,null>)=>({
  empty:locale==="fr"?"Sélectionnez au moins un indicateur.":"Select at least one indicator.",
  limit:locale==="fr"?"Maximum 6 indicateurs par graphique.":"Maximum 6 indicators per chart.",
  unknown:locale==="fr"?"Sélection d’indicateurs invalide.":"Invalid indicator selection.",
  "mixed-unit":locale==="fr"?"Les indicateurs doivent avoir la même unité.":"Indicators must use the same unit."
 })[code];
 const last=nums.length?nums[nums.length-1]:null;
 const gaugeValid=last!==null&&last>=0&&last<=100;
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
  {active&&<>
   {actual.length===0?<p role="status">{t("indicators.reporting.empty")}</p>:
    applied?.style==="gauge"&&!gaugeValid?<p role="alert">{locale==="fr"?"La jauge nécessite une valeur finale comprise entre 0 et 100 (référence : 100).":"Gauge requires a final value between 0 and 100 (reference: 100)."}</p>:
    isParts&&range.length>6?<p role="alert">{t("indicators.sharedChart.maxSlices")}</p>:
    isParts&&!nonnegative?<p role="alert">{locale==="fr"?"Secteurs et anneau nécessitent des valeurs non négatives et renseignées pour chaque Sprint.":"Pie and donut need nonnegative values for every cycle."}</p>:
    <SharedTrendChart payload={{
     type:applied?.style??"bar",locale,
     cycles:isParts?[{name:range[range.length-1]?.name??""}]:range.map(c=>({name:c.name})),
     series:isParts?range.map((c,i)=>({name:c.name,unit:active.unit,values:[nums[i]]})):
      series.map(item=>({name:item.column.name,unit:item.column.unit,values:item.values}))
    }} downloadName={"tendances-"+(multiple?"comparaison":active.tag).replace(/[^a-z0-9_-]/gi,"_")}/>}
   <div className="table-responsive mt-3"><table className="table table-sm table-striped"><thead><tr><th>{t("indicators.reporting.cycle")}</th><th>{t("indicators.reporting.status")}</th>{activeColumns.map(column=><th key={column.id} className="text-end">{column.name} ({column.unit})</th>)}</tr></thead><tbody>{range.map((c,i)=><tr key={c.id}><th>{c.name}</th><td>{c.status}</td>{series.map(item=><td key={item.column.id} className="text-end">{format(item.values[i])}</td>)}</tr>)}</tbody></table></div>
  </>}
  </>}
 </section>;
}
