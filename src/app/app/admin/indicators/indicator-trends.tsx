"use client";
import {useEffect,useMemo,useState} from "react";
import SharedTrendChart from "./shared-trend-chart";
import {useTranslation} from "@/i18n/client";
import {formatIndicatorValue} from "@/lib/indicators/format-value";
import {trendNumbers} from "@/lib/indicators/trend-series";
import {initialTrendRows,nextTrendRow,validTrendRows,type TrendRow as IndicatorRow,type TrendChartStyle as Style} from "@/lib/indicators/trend-config";

type Column={id:string;tag:string;name:string;unit:string};
type Cycle={id:string;name:string;status:string;values:Record<string,string|null>};
type Report={columns:Column[];cycles:Cycle[]};
type Applied={rows:IndicatorRow[];start:string;end:string};
const MAX_INDICATOR_ROWS=5;
const styles:Style[]=["bar","line","pie","donut","gauge","area"];

export function defaultTrendRange(cycles:readonly Cycle[],currentId?:string){
 const end=Math.max(0,currentId?cycles.findIndex(c=>c.id===currentId):cycles.length-1);
 const last=currentId&&cycles.findIndex(c=>c.id===currentId)<0?Math.max(0,cycles.length-1):end;
 return {start:cycles[Math.max(0,last-5)]?.id??"",end:cycles[last]?.id??""};
}
export default function IndicatorTrends({teamId,cycleType,cycleId,locale}:{teamId:string;cycleType:"scrum"|"kanban";cycleId?:string;locale:"fr"|"en"}){
 const t=useTranslation();
 const [report,setReport]=useState<Report|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(true);
 const [rows,setRows]=useState<IndicatorRow[]>([]);
 const [start,setStart]=useState("");
 const [end,setEnd]=useState("");
 const [applied,setApplied]=useState<Applied|null>(null);
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/indicators/reporting?"+new URLSearchParams({teamId,cycleType,screen:"trends"}),{signal:ctrl.signal,cache:"no-store"})
   .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<Report>;})
   .then(data=>{
    if(ctrl.signal.aborted)return;
    const range=defaultTrendRange(data.cycles,cycleId);
    const initial=initialTrendRows(data.columns);
    setReport(data);
    setRows(initial);
    setStart(range.start);
    setEnd(range.end);
    setApplied({rows:initial,start:range.start,end:range.end});
    setBusy(false);
    setError("");
   })
   .catch(()=>{if(!ctrl.signal.aborted){setBusy(false);setError(t("indicators.reporting.unavailable"));}});
  return()=>ctrl.abort();
 },[teamId,cycleType,cycleId,t]);

 const validBounds=!!report&&report.cycles.some(c=>c.id===start)&&report.cycles.some(c=>c.id===end)&&
  report.cycles.findIndex(c=>c.id===start)<=report.cycles.findIndex(c=>c.id===end);
 const range=useMemo(()=>{
  if(!report||!applied)return [];
  const a=report.cycles.findIndex(c=>c.id===applied.start);
  const b=report.cycles.findIndex(c=>c.id===applied.end);
  return a>=0&&b>=a?report.cycles.slice(a,b+1):[];
 },[report,applied]);
 const selected=applied?.rows.map(row=>({row,column:report?.columns.find(c=>c.id===row.indicatorId)}))
  .filter((item):item is {row:IndicatorRow;column:Column}=>!!item.column)??[];
 const format=(value:number|null)=>formatIndicatorValue(value,locale);
 const label=(style:Style)=>({
  bar:locale==="fr"?"Barres":"Bars",
  line:locale==="fr"?"Ligne":"Line",
  pie:locale==="fr"?"Secteurs":"Pie",
  donut:locale==="fr"?"Anneau":"Donut",
  gauge:locale==="fr"?"Jauge":"Gauge",
  area:locale==="fr"?"Aire":"Area"
 })[style];
 const changeRow=(key:number,update:Partial<Pick<IndicatorRow,"indicatorId"|"style">>)=>
  setRows(previous=>previous.map(row=>row.key===key?{...row,...update}:row));
 const addRow=()=>setRows(previous=>nextTrendRow(
  previous.map(row=>["pie","donut","gauge"].includes(row.style)?{...row,style:"bar"}:row),
  report?.columns??[]));
 const removeRow=(key:number)=>setRows(previous=>previous.length<=1?previous:previous.filter(row=>row.key!==key));
 const canAdd=!!report&&rows.length<MAX_INDICATOR_ROWS&&report.columns.some(column=>!rows.some(row=>row.indicatorId===column.id));

 return <section className="smn-panel rounded-4 p-3 my-3" aria-label={t("indicators.reporting.title")}>
  <h2 className="h5 mb-3">{t("indicators.reporting.title")}</h2>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {busy&&<p role="status">{t("indicators.reporting.loading")}</p>}
  {report&&<>
   <form className="mb-3" onSubmit={event=>{
    event.preventDefault();
    if(!validBounds){setError(locale==="fr"?"Plage de Sprints invalide.":"Invalid cycle range.");return;}
    if(!validTrendRows(rows,report.columns)){
     setError(locale==="fr"?"Sélectionnez entre un et cinq indicateurs différents.":"Select between one and five different indicators.");
     return;
    }
    setError("");
    setApplied({rows:rows.map(row=>({...row})),start,end});
   }}>
    <div className="d-flex flex-wrap align-items-end gap-3 mb-3">
     <label className="form-label mb-0 flex-grow-1" style={{minWidth:180}}>
      {locale==="fr"?"Sprint de départ":"Start cycle"}
      <select className="form-select mt-1" value={start} onChange={event=>setStart(event.target.value)}>
       {report.cycles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
     </label>
     <label className="form-label mb-0 flex-grow-1" style={{minWidth:180}}>
      {locale==="fr"?"Sprint de fin":"End cycle"}
      <select className="form-select mt-1" value={end} onChange={event=>setEnd(event.target.value)}>
       {report.cycles.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
     </label>
     <button className="btn btn-primary" type="submit" disabled={!validBounds||!validTrendRows(rows,report.columns)}>
      {locale==="fr"?"Filtrer":"Filter"}
     </button>
    </div>
    <div className="d-grid gap-2">
     {rows.map((row,index)=><div key={row.key} className="d-flex flex-wrap align-items-end gap-2">
      <label className="form-label mb-0 flex-grow-1" style={{minWidth:220}}>
       {locale==="fr"?"Indicateur":"Indicator"} {index+1}
       <select className="form-select mt-1" value={row.indicatorId}
        onChange={event=>changeRow(row.key,{indicatorId:event.target.value})}>
        {report.columns.filter(column=>column.id===row.indicatorId||
         !rows.some(other=>other.key!==row.key&&other.indicatorId===column.id))
         .map(column=><option key={column.id} value={column.id}>{column.name}</option>)}
       </select>
      </label>
      <label className="form-label mb-0" style={{minWidth:170,flex:"0 1 240px"}}>
       {locale==="fr"?"Style graphique":"Chart style"}
       <select className="form-select mt-1" value={row.style}
        onChange={event=>changeRow(row.key,{style:event.target.value as Style})}>
        {styles.map(style=><option key={style} value={style} disabled={rows.length>1&&["pie","donut","gauge"].includes(style)}>{label(style)}</option>)}
       </select>
      </label>
      <div style={{width:38,flexShrink:0}} className="d-flex justify-content-end">
       {index>0&&<button type="button" className="btn btn-outline-danger"
        aria-label={locale==="fr"?"Retirer l’indicateur "+index:"Remove indicator "+index}
        title={locale==="fr"?"Retirer cet indicateur":"Remove this indicator"}
        onClick={()=>removeRow(row.key)}>−</button>}
      </div>
     </div>)}
     {canAdd&&<button type="button" className="btn btn-outline-primary d-flex justify-content-center align-items-center w-100"
      style={{minHeight:48,borderStyle:"dashed",fontSize:"1.3rem"}}
      onClick={addRow} aria-label={locale==="fr"?"Ajouter un indicateur":"Add an indicator"}
      title={locale==="fr"?"Ajouter un indicateur":"Add an indicator"}>+</button>}
    </div>
   </form>
   {report.columns.length===0&&<p role="status">{t("indicators.reporting.empty")}</p>}
   {range.length>24?<p role="alert">{t("indicators.sharedChart.maxCycles")}</p>:
    selected.length>0&&(()=>{
     const series=selected.map(({column})=>({name:column.name,unit:column.unit,values:trendNumbers(range,column.id)}));
     const chartTypes=selected.map(({row})=>row.style);
     const multiple=selected.length>1;
     const mixedUnits=new Set(series.map(item=>item.unit.trim().toLocaleLowerCase())).size>1;
     const chartStyle=multiple?"bar":chartTypes[0];
     const nums=series[0]?.values??[];
     const actual=series.flatMap(item=>item.values).filter((v):v is number=>v!==null);
     const parts=chartStyle==="pie"||chartStyle==="donut";
     const last=nums.at(-1)??null;
     const gaugeValid=last!==null&&last>=0&&last<=100;
     const nonnegative=nums.length>0&&nums.every(v=>v!==null&&v>=0)&&nums.some(v=>v!==null&&v>0);
     return actual.length===0?<p role="status">{t("indicators.reporting.empty")}</p>:
      multiple&&chartTypes.some(style=>!["bar","line","area"].includes(style))?
       <p role="alert">{locale==="fr"?"Plusieurs indicateurs : utilisez Barres, Ligne ou Aire.":"Multiple indicators: use Bars, Line or Area."}</p>:
      mixedUnits?<p role="alert">{locale==="fr"?"Les indicateurs d'un même graphique doivent avoir la même unité.":"Indicators on the same chart must have the same unit."}</p>:
      chartStyle==="gauge"&&!gaugeValid?<p role="alert">{locale==="fr"?"La jauge nécessite une valeur finale comprise entre 0 et 100 (référence : 100).":"Gauge requires a final value between 0 and 100 (reference: 100)."}</p>:
      parts&&range.length>6?<p role="alert">{t("indicators.sharedChart.maxSlices")}</p>:
      parts&&!nonnegative?<p role="alert">{locale==="fr"?"Secteurs et anneau nécessitent des valeurs non négatives et renseignées pour chaque Sprint.":"Pie and donut need nonnegative values for every cycle."}</p>:
      <SharedTrendChart payload={{
       type:chartStyle,locale,
       cycles:parts?[{name:range[range.length-1]?.name??""}]:range.map(c=>({name:c.name})),
       series:parts?range.map((cycle,i)=>({name:cycle.name,unit:series[0].unit,values:[nums[i]]})):series,
       ...(multiple?{seriesTypes:chartTypes as ("bar"|"line"|"area")[]}:{})
      }} downloadName="tendances-comparaison"/>;
    })()}
   {selected.length>0&&range.length<=24&&<div className="table-responsive mt-3">
    <table className="table table-sm table-striped">
     <thead><tr><th>{t("indicators.reporting.cycle")}</th><th>{t("indicators.reporting.status")}</th>
      {selected.map(({row,column})=><th key={row.key} className="text-end">{column.name} ({column.unit})</th>)}
     </tr></thead>
     <tbody>{range.map((cycle,index)=><tr key={cycle.id}>
      <th>{cycle.name}</th><td>{cycle.status}</td>
      {selected.map(({row,column})=><td key={row.key} className="text-end">
       {format(trendNumbers(range,column.id)[index])}
      </td>)}
     </tr>)}</tbody>
    </table>
   </div>}
  </>}
 </section>;
}
