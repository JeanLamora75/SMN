"use client";
import {useEffect,useState} from "react";
import UniversalIndicatorInput from "./universal-input";
import {useTranslation} from "@/i18n/client";
import {formatIndicatorMeasurement} from "@/lib/indicators/format-value";
type Column={id:string;tag:string;name:string;unit:string};
type Cycle={id:string;name:string;status:string;startAt?:string;endAt?:string;values:Record<string,string|null>};
type Result={columns:Column[];cycles:Cycle[]};
/** Initiales de chaque mot, y compris les petits mots (ex. "Taux de réalisation" → "TDR"). */
export function indicatorHeaderInitials(name:string):string{
 const words=name.match(/[\p{L}\p{N}]+/gu)??[];
 return words.map(word=>word.charAt(0).toLocaleUpperCase("fr-FR")).join("")||name;
}
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
 const date=(v:string|undefined)=>{if(!v)return "—";const d=new Date(v);return Number.isNaN(d.getTime())?v.slice(0,10):new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(d);};
 const value=(v:string|null|undefined,unit:string)=>formatIndicatorMeasurement(v,unit,locale);
 return <section className="smn-indicator-cycles" aria-label={t("indicators.reporting.title")}>
  {error&&<p role="alert" className="alert alert-warning">{t("indicators.reporting.unavailable")}</p>}
  {!data&&!error&&<p role="status">{t("indicators.reporting.loading")}</p>}
  {data&&<><p className="small text-body-secondary mb-2">{data.columns.length} indicateur(s) affiché(s) pour cette équipe. Faites défiler le tableau horizontalement si nécessaire.</p><div className="table-responsive smn-indicator-cycle-scroll" tabIndex={0} role="region" aria-label="Tableau des indicateurs par cycle, défilement horizontal"><table className="table table-hover align-middle smn-indicator-cycle-table">
   <thead><tr><th scope="col" className="smn-cycle-name-col">{t("indicators.reporting.cycle")}</th><th scope="col" className="smn-cycle-status-col">{t("indicators.reporting.status")}</th><th scope="col" className="smn-cycle-period-col">{t("indicators.dashboard.period")}</th>
    {data.columns.map(column=><th scope="col" key={column.id} title={column.name} aria-label={column.name} tabIndex={0} className="text-end smn-indicator-heading"><abbr title={column.name} className="smn-indicator-initials">{indicatorHeaderInitials(column.name)}</abbr></th>)}
    <th scope="col" className="text-end">{t("indicators.actions")}</th></tr></thead>
   <tbody>{data.cycles.map(cycle=><tr key={cycle.id}>
    <th scope="row" className="smn-cycle-name-col">{cycle.name}</th><td className="smn-cycle-status-col">{cycle.status}</td><td className="smn-cycle-period-col text-nowrap">{date(cycle.startAt)} — {date(cycle.endAt)}</td>
    {data.columns.map(column=><td key={column.id} className="text-end">{value(cycle.values[column.id],column.unit)}</td>)}
    <td className="text-end"><UniversalIndicatorInput key={cycle.id} teamId={teamId} cycleType={cycleType} cycleId={cycle.id} buttonLabel={t("indicators.edit")}/></td>
   </tr>)}</tbody>
  </table>{data.cycles.length===0&&<p role="status">{t("indicators.reporting.empty")}</p>}</div></>}
 </section>;
}
