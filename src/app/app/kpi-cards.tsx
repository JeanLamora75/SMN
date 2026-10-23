import type {CSSProperties} from "react";
import BootstrapIcon from "./bootstrap-icon";
import {dashboardMetricRatio} from "@/lib/dashboard-metric-ratio";
import {translate,type TranslationKey} from "@/i18n/catalog";
import type {Language} from "@/lib/language";
import type {DashboardMetric,DashboardDataSource} from "@/lib/dashboard-data-contract";

const sources:Record<DashboardDataSource,TranslationKey>={
 manual:"dashboard.cockpit.metricManual",
 calculated:"dashboard.cockpit.metricCalculated",
 imported:"dashboard.cockpit.metricImported",
 "recorded-events":"dashboard.cockpit.metricRecordedEvents",
 "closure-snapshot":"dashboard.cockpit.metricSnapshot"
};
type Icon="people-fill"|"stack"|"ticket-perforated-fill";
type Tone="capacity"|"points"|"tickets";

function MetricDisplay({metric,locale,unit,empty,large=false}:Readonly<{
 metric?:DashboardMetric;locale:Language;unit:string;empty:string;large?:boolean;
}>){
 const t=(key:TranslationKey)=>translate(locale,key);
 const available=metric?.state==="available";
 const shown=available?
  new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{maximumFractionDigits:4}).format(metric.value):
  metric?.state==="not-recorded"?t("dashboard.cockpit.notSpecified"):
  metric?.state==="unavailable"&&metric.reason!=="producer-not-ready"?
   t("dashboard.cockpit.notAvailable"):empty;
 return <div className={"smn-kpi-measure "+(large?"smn-kpi-measure-main":"")}>
  <span className={available?"smn-kpi-number":"smn-kpi-missing"}>
   {shown}{available&&<span className="smn-kpi-unit"> {unit}</span>}
  </span>
  {available&&<small className="smn-kpi-source">
   {t(sources[metric.source])}
   {metric.quality==="estimated"?" · "+t("dashboard.cockpit.metricEstimated"):""}
  </small>}
 </div>;
}

export function KpiMetricPair({title,first,second,unit,empty,comparison,firstMetric,
 secondMetric,locale,icon,tone,ratioKey}:Readonly<{
 title:string;first:string;second:string;unit:string;empty:string;comparison:string;
 firstMetric?:DashboardMetric;secondMetric?:DashboardMetric;locale:Language;
 icon:Icon;tone:Tone;ratioKey:TranslationKey;
}>){
 const ratio=dashboardMetricRatio(firstMetric,secondMetric);
 const caption=ratio?translate(locale,ratioKey,{percent:ratio.percentage}):null;
 const fill=ratio?({"--smn-kpi-fill":ratio.visualFill+"%"} as CSSProperties):undefined;
 return <article className={"smn-metric-card smn-kpi-card smn-kpi-"+tone}>
  <header className="smn-kpi-heading">
   <span className="smn-kpi-icon"><BootstrapIcon name={icon}/></span>
   <h2 className="smn-metric-title">{title}</h2>
  </header>
  <dl className="smn-metric-values">
   <div className="smn-kpi-primary">
    <dt className="smn-metric-label">{first} <span className="smn-metric-unit">({unit})</span></dt>
    <dd><MetricDisplay metric={firstMetric} unit={unit} empty={empty} locale={locale} large/></dd>
   </div>
   <div className="smn-kpi-secondary">
    <div className="smn-kpi-secondary-value">
     <dt className="smn-metric-label">{second} <span className="smn-metric-unit">({unit})</span></dt>
     <dd><MetricDisplay metric={secondMetric} unit={unit} empty={empty} locale={locale}/></dd>
    </div>
    {ratio&&caption&&<div className="smn-kpi-ring" role="img"
       aria-label={caption} style={fill}>
      <span aria-hidden="true">{new Intl.NumberFormat(
       locale==="fr"?"fr-FR":"en-GB").format(ratio.percentage)}%</span>
     </div>}
   </div>
  </dl>
  <p className="smn-metric-comparison">{comparison}</p>
 </article>;
}

export function KpiDeadline({locale,metric,cycleExists,status}:Readonly<{
 locale:Language;metric?:DashboardMetric;cycleExists:boolean;status:string|null;
}>){
 const t=(key:TranslationKey)=>translate(locale,key);
 const available=metric?.state==="available";
 const explanation=available?
   (status==="closed"||status==="finished"?
    t("dashboard.cockpit.workingDaysEnded"):
    status==="planned"?t("dashboard.cockpit.workingDaysUpcoming"):
    t("dashboard.cockpit.todayIncludedProvisional")):
   t(cycleExists?"dashboard.cockpit.workingDaysPending":"dashboard.cockpit.workingDaysHelp");
 return <article className="smn-metric-card smn-metric-deadline smn-kpi-card smn-kpi-days">
  <header className="smn-kpi-heading">
   <span className="smn-kpi-icon"><BootstrapIcon name="calendar-event"/></span>
   <h2 className="smn-metric-title">{t("dashboard.cockpit.workingDays")}</h2>
  </header>
  <p className={available?"smn-kpi-days-number":"smn-deadline-unavailable"}>
   {available?<>
    {new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB").format(metric.value)}
    <span className="smn-kpi-unit"> {t("dashboard.cockpit.daysUnit")}</span>
   </>:cycleExists?t("dashboard.cockpit.notCalculable"):t("dashboard.cockpit.notSpecified")}
  </p>
  <p className="smn-deadline-explanation">{explanation}</p>
 </article>;
}
