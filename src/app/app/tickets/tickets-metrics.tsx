"use client";

import {useState} from "react";
import BootstrapIcon from "../bootstrap-icon";
import {useTranslation} from "@/i18n/client";
import type {TicketGroupCount,TicketSummaryScopes} from "@/lib/ticket-csv-summary";

type Props={summary:TicketSummaryScopes;hasFilters:boolean};
export default function TicketsMetrics({summary,hasFilters}:Props){
 const t=useTranslation();
 const [selectedScope,setSelectedScope]=useState<"filtered"|"all">("filtered");
 const current=selectedScope==="filtered"?summary.filtered:summary.all;
 const label=(value:string)=>value||t("tickets.browseMissing");
 const breakdown=(items:readonly TicketGroupCount[],title:string,id:string)=><section
  className="smn-tickets-metric-breakdown" aria-labelledby={id}>
  <h4 id={id}>{title}</h4>
  {items.length?<div className="smn-tickets-metric-breakdown-table">
   <div className="smn-tickets-metric-breakdown-header">
    <span className="visually-hidden">{title}</span>
    <span>{t("tickets.metricsTickets")}</span>
    <span>{t("tickets.metricsGroupStoryPoints")}</span>
   </div>
   <ul>{items.map(group=><li key={group.value}>
    <span>{label(group.value)}</span>
    <strong>{group.count}</strong>
    <strong>{group.storyPoints.sum??t("tickets.metricsUnavailable")}</strong>
   </li>)}</ul>
  </div>:<p>{t("tickets.metricsNoGroups")}</p>}
 </section>;
 return <section className="smn-tickets-panel smn-tickets-metrics"
  aria-labelledby="smn-tickets-metrics-heading">
  <div className="smn-tickets-panel-heading smn-tickets-metrics-heading">
   <h2 id="smn-tickets-metrics-heading">
    <BootstrapIcon name="bar-chart-line"/> {t("tickets.metricsTitle")}
   </h2>
   <div className="smn-tickets-metrics-scope" role="group" aria-label={t("tickets.metricsScope")}>
    <button type="button" className={"btn btn-sm "+(selectedScope==="filtered"?"btn-primary":"btn-outline-secondary")}
     aria-pressed={selectedScope==="filtered"} onClick={()=>setSelectedScope("filtered")}>
     {t("tickets.metricsFiltered")}
    </button>
    <button type="button" className={"btn btn-sm "+(selectedScope==="all"?"btn-primary":"btn-outline-secondary")}
     aria-pressed={selectedScope==="all"} onClick={()=>setSelectedScope("all")}>
     {t("tickets.metricsAll")}
    </button>
   </div>
  </div>
  <p className="smn-tickets-note">
   {t(selectedScope==="filtered"?"tickets.metricsFilteredDescription":"tickets.metricsAllDescription")}
   {hasFilters&&selectedScope==="filtered"?" "+t("tickets.metricsFilterActive"):""}
  </p>
  <div className="smn-tickets-metrics-kpis">
   <div><span>{t("tickets.metricsTickets")}</span><strong>{current.ticketCount}</strong></div>
   <div><span>{t("tickets.metricsCompleted")}</span><strong>{current.completedCount}</strong></div>
   <div><span>{t("tickets.metricsSum")}</span>
    <strong>{current.storyPoints.sum??t("tickets.metricsUnavailable")}</strong>
   </div>
   <div><span>{t("tickets.metricsNumeric")}</span><strong>{current.storyPoints.numericCount}</strong></div>
  </div>
  <p className="smn-tickets-metrics-quality">
   {t("tickets.metricsMissing",{count:current.storyPoints.missingCount})}
   {" · "}
   {t("tickets.metricsInvalid",{count:current.storyPoints.invalidCount})}
  </p>
  {current.storyPoints.sum===null&&<p className="smn-tickets-note">{t("tickets.metricsNoSum")}</p>}
  <div className="smn-tickets-metrics-groups">
   {breakdown(current.byType,t("tickets.metricsByType"),"smn-tickets-metrics-type")}
   {breakdown(current.byStatus,t("tickets.metricsByStatus"),"smn-tickets-metrics-status")}
   {breakdown(current.byPrefix,t("tickets.metricsByPrefix"),"smn-tickets-metrics-prefix")}
  </div>
 </section>;
}
