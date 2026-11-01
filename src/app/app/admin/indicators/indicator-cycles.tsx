"use client";
import {useEffect,useState} from "react";
import UniversalIndicatorInput from "./universal-input";
import {useTranslation} from "@/i18n/client";
type Column={id:string;tag:string;name:string;unit:string};
type Cycle={id:string;name:string;status:string;values:Record<string,string|null>};
type Result={columns:Column[];cycles:Cycle[]};
export default function IndicatorCycles({teamId,cycleType,locale}:{teamId:string;cycleType:"scrum"|"kanban";locale:"fr"|"en"}){
 const t=useTranslation(),[data,setData]=useState<Result|null>(null),[error,setError]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  const refresh=(event:Event)=>{const d=(event as CustomEvent<{teamId:string}>).detail;if(d?.teamId===teamId)setRevision(n=>n+1);};
  window.addEventListener("smn:indicators-saved",refresh);
  return()=>{controller.abort();window.removeEventListener("smn:indicators-saved",refresh);};
 },[teamId]);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/indicators/reporting?"+new URLSearchParams({teamId,cycleType,screen:"cycle_list"}),{cache:"no-store",signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<Result>;})
   .then(value=>{if(!controller.signal.aborted){setData(value);setError(false);}})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return()=>controller.abort();
 },[teamId,cycleType,revision]);
 const value=(v:string|null|undefined,unit:string)=>v==null?"—":v.replace(".",locale==="fr"?",":".")+(unit?" "+unit:"");
 return <section className="smn-panel rounded-4 p-3" aria-label={t("indicators.reporting.title")}>
  {error&&<p role="alert" className="alert alert-warning">{t("indicators.reporting.unavailable")}</p>}
  {!data&&!error&&<p role="status">{t("indicators.reporting.loading")}</p>}
  {data&&<div className="table-responsive"><table className="table table-hover align-middle">
   <thead><tr><th scope="col">{t("indicators.reporting.cycle")}</th><th scope="col">{t("indicators.reporting.status")}</th>
    {data.columns.map(column=><th scope="col" key={column.id} title={column.name} className="text-end">{column.tag}</th>)}
    <th scope="col">{t("indicators.actions")}</th></tr></thead>
   <tbody>{data.cycles.map(cycle=><tr key={cycle.id}>
    <th scope="row">{cycle.name}</th><td>{cycle.status}</td>
    {data.columns.map(column=><td key={column.id} className="text-end">{value(cycle.values[column.id],column.unit)}</td>)}
    <td><UniversalIndicatorInput key={cycle.id} teamId={teamId} cycleType={cycleType} cycleId={cycle.id}/></td>
   </tr>)}</tbody>
  </table>{data.cycles.length===0&&<p role="status">{t("indicators.reporting.empty")}</p>}</div>}
 </section>;
}
