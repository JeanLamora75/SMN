import Link from "next/link";
import {translate,type TranslationKey} from "@/i18n/catalog";
import type {Language} from "@/lib/language";
import type {DashboardContext} from "@/server/dashboard/read";
import {effectiveSprintStatus,type SprintContextItem} from "@/lib/sprint-context";
import type {CollectiveCycleProjection,DashboardMetric,DashboardDataSource} from "@/lib/dashboard-data-contract";

type Props=Readonly<{
  context:DashboardContext;
  locale:Language;
  teamHref:string;
  cycle:SprintContextItem|null;
  projection?:CollectiveCycleProjection|null;
}>;

function MetricLine({label,unit,empty,value,locale}:Readonly<{
 label:string;unit:string;empty:string;value?:DashboardMetric;locale:Language
}>){
 const t=(key:TranslationKey)=>translate(locale,key);
 const shown=value?.state==="available"?
  new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB",{maximumFractionDigits:4}).format(value.value):
  value?.state==="not-recorded"?t("dashboard.cockpit.notSpecified"):
  value?.state==="unavailable"&&value.reason!=="producer-not-ready"?
   t("dashboard.cockpit.notAvailable"):empty;
 const sourceLabels:Record<DashboardDataSource,TranslationKey>={
  manual:"dashboard.cockpit.metricManual",
  calculated:"dashboard.cockpit.metricCalculated",
  imported:"dashboard.cockpit.metricImported",
  "recorded-events":"dashboard.cockpit.metricRecordedEvents",
  "closure-snapshot":"dashboard.cockpit.metricSnapshot"
 };
 return <div className="smn-metric-row">
    <dt className="smn-metric-label">{label} <span className="smn-metric-unit">({unit})</span></dt>
    <dd className={value?.state==="available"?"smn-metric-value":"smn-metric-empty"}>
      {shown}
      {value?.state==="available"&&<small className="text-secondary d-block">
        {t(sourceLabels[value.source])}
        {value.quality==="estimated"?" · "+t("dashboard.cockpit.metricEstimated"):""}
      </small>}
    </dd>
  </div>;
}

function MetricPair({title,first,second,unit,empty,comparison,firstMetric,secondMetric,locale}:Readonly<{
  title:string;first:string;second:string;unit:string;empty:string;comparison:string;
  firstMetric?:DashboardMetric;secondMetric?:DashboardMetric;locale:Language;
}>){
  return <article className="smn-metric-card">
    <h2 className="smn-metric-title">{title}</h2>
    <dl className="smn-metric-values">
      <MetricLine label={first} unit={unit} empty={empty} value={firstMetric} locale={locale}/>
      <MetricLine label={second} unit={unit} empty={empty} value={secondMetric} locale={locale}/>
    </dl>
    <p className="smn-metric-comparison">{comparison}</p>
  </article>;
}

/** SMN-235 : objectifs, J/H et SP alimentés depuis les sources réelles du Sprint.
 * Les tickets, jours ouvrés et registres restent hors périmètre de cette Story. */
export default function CycleOverview({context,locale,teamHref,cycle,projection}:Props){
  const t=(key:TranslationKey)=>translate(locale,key);
  const scrum=context.mode==="scrum";
  const effectiveStatus=cycle?effectiveSprintStatus(cycle):null;
  const statusKey:Record<string,TranslationKey>={
    planned:"sprintStates.planned",active:"sprintStates.active",
    finished:"sprintStates.finished",closed:"sprintStates.closed",
    suspended:"sprintStates.suspended"
  };
  const status=effectiveStatus? t(statusKey[effectiveStatus]??"dashboard.cockpit.notAvailable"):t("dashboard.cockpit.noCycle");
  const day=(iso:string)=>{
    const date=new Date(iso);
    if(!Number.isFinite(date.getTime())||!cycle)return t("dashboard.cockpit.notAvailable");
    try{return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
      timeZone:cycle.timeZone,day:"numeric",month:"short",year:"numeric"
    }).format(date);}catch{return t("dashboard.cockpit.notAvailable");}
  };
  const dates=cycle?day(cycle.startAt)+" — "+day(new Date(Date.parse(cycle.endAt)-1).toISOString()):
    t("dashboard.cockpit.notAvailable");
  const emptyMetric=cycle?t("dashboard.cockpit.dataPending"):t("dashboard.cockpit.notSpecified");
  const comparison=cycle?t("dashboard.cockpit.comparisonUnavailable"):t("dashboard.cockpit.noPreviousCycle");
  const goals=projection?.goals;
  const goalText=goals?.state==="unavailable"?
    (goals.reason==="producer-not-ready"?t("dashboard.cockpit.dataPending"):t("dashboard.cockpit.notAvailable")):
    goals?.state==="available"&&goals.items.length===0?t("dashboard.cockpit.notSpecified"):null;
  return <section className="smn-cycle-overview" id="pilotage"
    aria-labelledby="smn-cycle-overview-heading">
    <header className="smn-cycle-overview-header" id="cycles">
      <div className="smn-cycle-headline">
        <p className="smn-cycle-eyebrow">
          {t(scrum?"dashboard.sprint":"dashboard.kanbanCycle")}
        </p>
        <h1 id="smn-cycle-overview-heading">{cycle?.name??t("dashboard.cockpit.noCycle")}</h1>
        <p className="smn-cycle-context">
          <strong>{context.product}</strong>
          <span aria-hidden="true"> · </span>
          <span>{context.team}</span>
        </p>
        <p className="smn-cycle-description">
          {cycle?t("dashboard.cockpit.selectedSprintHelp"):
            t(scrum?"dashboard.cockpit.noSprintHelp":"dashboard.cockpit.noPeriodHelp")}
        </p>
        <Link className="btn btn-outline-primary btn-sm smn-cycle-team-link" href={teamHref}>
          {t("detail.openTeam")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="smn-cycle-facts" role="group" aria-label={t("dashboard.cockpit.details")}>
        <dl className="smn-cycle-fact-list">
          <div><dt>{t("dashboard.cockpit.dates")}</dt>
            <dd>{dates}</dd></div>
          <div><dt>{t("dashboard.cockpit.status")}</dt>
            <dd>{status}</dd></div>
          <div><dt>{t("dashboard.cockpit.goals")}</dt>
            <dd>{goals?.state==="available"&&goals.items.length>0?
              <ul className="list-unstyled mb-1">
                {goals.items.map(g=><li key={g.id} className="mb-1">
                  {g.title} <small className="text-secondary">
                    ({t(("sprintGoals."+g.evaluation) as TranslationKey)})
                  </small>
                </li>)}
              </ul>:
              goalText??t("dashboard.cockpit.notSpecified")}
            {goals?.state==="available"&&goals.items.length>0&&
              <Link className="small d-block" href="/app/admin/sprints">
                {t("dashboard.cockpit.viewSprintGoals")}
              </Link>}
            </dd></div>
        </dl>
      </div>
    </header>
    <div className="smn-metric-grid" role="group" aria-label={t("dashboard.cockpit.metrics")}>
      <MetricPair title={t("dashboard.cockpit.capacity")}
        first={t("dashboard.cockpit.plannedCapacity")}
        second={t("dashboard.cockpit.actualCapacity")}
        unit="J/H" empty={emptyMetric}
        firstMetric={projection?.capacity.initialJh} secondMetric={projection?.capacity.actualJh}
        locale={locale} comparison={comparison}/>
      <MetricPair title={t("dashboard.cockpit.storyPoints")}
        first={t("dashboard.cockpit.initialStoryPoints")}
        second={t("dashboard.cockpit.completedStoryPoints")}
        unit="SP" empty={emptyMetric}
        firstMetric={projection?.storyPoints.initial} secondMetric={projection?.storyPoints.done}
        locale={locale} comparison={comparison}/>
      <MetricPair title={t("dashboard.cockpit.tickets")}
        first={t("dashboard.cockpit.initialTickets")}
        second={t("dashboard.cockpit.completedTickets")}
        unit={t("dashboard.cockpit.ticketsUnit")}
        firstMetric={projection?.tickets.initial} secondMetric={projection?.tickets.done}
        empty={emptyMetric} locale={locale}
        comparison={comparison}/>
      <article className="smn-metric-card smn-metric-deadline">
        <h2 className="smn-metric-title">{t("dashboard.cockpit.workingDays")}</h2>
        <p className={projection?.workingDaysRemaining.state==="available"?
          "smn-metric-value":"smn-deadline-unavailable"}>
          {projection?.workingDaysRemaining.state==="available"?
           new Intl.NumberFormat(locale==="fr"?"fr-FR":"en-GB").format(
            projection.workingDaysRemaining.value):
           cycle?t("dashboard.cockpit.notCalculable"):t("dashboard.cockpit.notSpecified")}
        </p>
        <p className="smn-deadline-explanation">
          {projection?.workingDaysRemaining.state==="available"?
            t("dashboard.cockpit.todayIncludedProvisional"):
            t(cycle?"dashboard.cockpit.workingDaysPending":"dashboard.cockpit.workingDaysHelp")}
        </p>
      </article>
    </div>
  </section>;
}
