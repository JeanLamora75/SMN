import type {CSSProperties} from "react";
import Link from "next/link";
import BootstrapIcon from "./bootstrap-icon";
import {dashboardMetricRatio} from "@/lib/dashboard-metric-ratio";
import {dashboardStoryPointsPerJh} from "@/lib/dashboard-sp-per-jh";
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

/** Only the retained collective SP and J/H metrics are divided; no member data. */
function StoryPointsDensity({points,capacity,locale,label}:Readonly<{
 points?:DashboardMetric;capacity?:DashboardMetric;locale:Language;label:string;
}>){
 const metric=dashboardStoryPointsPerJh(points,capacity);
 const key=metric.state==="not-calculable"?"dashboard.cockpit.notCalculable":
  metric.state==="unavailable"?"dashboard.cockpit.notAvailable":
  "dashboard.cockpit.notSpecified";
 const value=metric.state==="available"?
  new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{
   maximumFractionDigits:4
  }).format(metric.value):translate(locale,key);
 return <div className="smn-kpi-density">
  <span className="smn-kpi-density-label">{label}</span>
  <span className={metric.state==="available"?"smn-kpi-density-value":"smn-kpi-density-missing"}>
   {value}{metric.state==="available"&&<span className="smn-kpi-density-unit"> SP/J/H</span>}
  </span>
 </div>;
}

export function KpiMetricPair({title,first,second,unit,empty,comparison,firstMetric,
 secondMetric,locale,icon,tone,ratioKey,spPerJh,action}:Readonly<{
 title:string;first:string;second:string;unit:string;empty:string;comparison:string;
 firstMetric?:DashboardMetric;secondMetric?:DashboardMetric;locale:Language;
 icon:Icon;tone:Tone;ratioKey:TranslationKey;
 spPerJh?:Readonly<{planned?:DashboardMetric;actual?:DashboardMetric}>;
 action?:Readonly<{href:string;label:string}>;
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
   <div className={"smn-kpi-primary"+(spPerJh?" smn-kpi-sp-line":"")}>
    <div className="smn-kpi-sp-value">
     <dt className="smn-metric-label">{first} <span className="smn-metric-unit">({unit})</span></dt>
     <dd><MetricDisplay metric={firstMetric} unit={unit} empty={empty} locale={locale} large/></dd>
    </div>
    {spPerJh&&<StoryPointsDensity points={firstMetric} capacity={spPerJh.planned}
     label={translate(locale,"dashboard.cockpit.committedPerPlannedJh")} locale={locale}/>}
   </div>
   <div className={"smn-kpi-secondary"+(spPerJh?" smn-kpi-secondary-sp":"")}>
    <div className={"smn-kpi-secondary-value"+(spPerJh?" smn-kpi-sp-line":"")}>
     <div className="smn-kpi-sp-value">
      <dt className="smn-metric-label">{second} <span className="smn-metric-unit">({unit})</span></dt>
      <dd><MetricDisplay metric={secondMetric} unit={unit} empty={empty} locale={locale}/></dd>
     </div>
     {spPerJh&&<StoryPointsDensity points={secondMetric} capacity={spPerJh.actual}
      label={translate(locale,"dashboard.cockpit.completedPerActualJh")} locale={locale}/>}
    </div>
    {ratio&&caption&&<div className="smn-kpi-ring" role="img"
       aria-label={caption} style={fill}>
      <span aria-hidden="true">{new Intl.NumberFormat(
       locale==="fr"?"fr-FR":"en-GB").format(ratio.percentage)}%</span>
     </div>}
   </div>
  </dl>
  <p className="smn-metric-comparison">{comparison}</p>
  {action&&<Link href={action.href} className="smn-kpi-card-action small">{action.label}</Link>}
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

/** Deux notes indépendantes, sans portion colorée pour une note absente ou invalide. */
export function KpiSprintScores({locale,scores}:Readonly<{
 locale:Language;scores?:Readonly<{confidence:DashboardMetric;clarity:DashboardMetric}>;
}>){
 const t=(key:TranslationKey,params?:Record<string,string|number>)=>translate(locale,key,params);
 const indicators=[
  {code:"I01",label:t("dashboard.cockpit.scoreConfidence"),metric:scores?.confidence},
  {code:"I02",label:t("dashboard.cockpit.scoreClarity"),metric:scores?.clarity}
 ];
 const arc="M 10 60 A 50 50 0 0 1 110 60";
 return <article className="smn-metric-card smn-kpi-card smn-kpi-scores">
  {indicators.map(({code,label,metric})=>{
   const score=metric?.state==="available"?metric.value:null;
   const valid=typeof score==="number"&&Number.isInteger(score)&&score>=1&&score<=5;
   const percent=valid?score*20:null;
   return <section key={code} className="smn-score-section">
    <h2 className="smn-score-label">{code} · {label}</h2>
    <div className="smn-score-readout" role="img" tabIndex={0}
     aria-label={percent===null?t("dashboard.cockpit.scoreGaugeMissing",{name:label}):
      t("dashboard.cockpit.scoreGaugeValue",{name:label,percent,score:score!})}>
     <svg className="smn-score-gauge" viewBox="0 0 120 70" aria-hidden="true" focusable="false">
      <path className="smn-score-track" d={arc} fill="none" strokeWidth="11"/>
      {percent!==null&&<path className="smn-score-progress" d={arc}
       fill="none" strokeWidth="11" pathLength={100} strokeDasharray={`${percent} 100`}/>}
     </svg>
     <span className="smn-score-text">
      {percent===null?<span className="smn-score-empty">{t("dashboard.cockpit.notSpecified")}</span>:
       <><strong>{percent}{locale==="fr"?" %":"%"}</strong><small>{score}/5</small></>}
     </span>
    </div>
   </section>;
  })}
 </article>;
}
