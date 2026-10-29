import Link from "next/link";
import {translate,type TranslationKey} from "@/i18n/catalog";
import type {Language} from "@/lib/language";
import type {DashboardContext} from "@/server/dashboard/read";
import {effectiveSprintStatus,type SprintContextItem} from "@/lib/sprint-context";
import type {CollectiveCycleProjection} from "@/lib/dashboard-data-contract";
import BootstrapIcon from "./bootstrap-icon";
import {sprintDetailPath} from "@/lib/sprint-detail-path";
import {KpiMetricPair,KpiDeadline,KpiSprintScores} from "./kpi-cards";

type Props=Readonly<{
  context:DashboardContext;
  locale:Language;
  teamHref:string;
  cycle:SprintContextItem|null;
  projection?:CollectiveCycleProjection|null;
  canViewCapacity?:boolean;
}>;

export default function CycleOverview({context,locale,teamHref,cycle,projection,canViewCapacity,}:Props){
  const t=(key:TranslationKey,params?:Record<string,string|number>)=>translate(locale,key,params);
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
  return <section className="smn-cycle-overview" id="pilotage"
    aria-labelledby="smn-cycle-overview-heading">
    <header className="smn-cycle-overview-header smn-cycle-header-compact" id="cycles">
      <div className="smn-cycle-identity">
        <h1 id="smn-cycle-overview-heading">{cycle?cycle.name+" - "+context.team:t("dashboard.cockpit.noCycle")}</h1>
        {!cycle&&<p className="smn-cycle-context mb-1"><strong>{context.team}</strong> · {context.product}</p>}
        {cycle?<div className="smn-cycle-summary" role="group" aria-label={t("dashboard.cockpit.details")}>
          <span className="smn-cycle-date-range">
            <BootstrapIcon name="calendar3"/>
            <span>{dates}</span>
          </span>
          <span className="smn-cycle-status" data-status={effectiveStatus??"unknown"}>
            {status}
          </span>
        </div>:<p className="smn-cycle-description">
          {t(scrum?"dashboard.cockpit.noSprintHelp":"dashboard.cockpit.noPeriodHelp")}
        </p>}
      </div>
      <div className="smn-cycle-goal-block" aria-label={t("dashboard.cockpit.sprintGoal")}>
        <span className="smn-cycle-goal-icon"><BootstrapIcon name="bullseye"/></span>
        <div className="smn-cycle-goal-copy">
          <h2>{t("dashboard.cockpit.sprintGoal")}</h2>
          {goals?.state==="available"&&goals.items.length>0?<ul className="list-unstyled mb-0 smn-cycle-goal-list">
            {goals.items.slice(0,3).map(goal=><li key={goal.id} className="smn-cycle-goal-text">{goal.title}</li>)}
          </ul>:<p className="smn-cycle-goal-placeholder">
            {goals?.state==="available"?t("dashboard.cockpit.goalNotSpecified"):
              goals?.state==="unavailable"?t("dashboard.cockpit.notAvailable"):
              t("dashboard.cockpit.goalNotSpecified")}
          </p>}
        </div>
      </div>
      <div className="smn-cycle-header-actions">
        {cycle?
          <Link className="btn btn-outline-primary btn-sm smn-cycle-detail-link"
            href={sprintDetailPath(cycle.id)}>
            {t("dashboard.cockpit.viewSprintDetail")}
            <BootstrapIcon name="arrow-right"/>
          </Link>:
          <Link className="btn btn-outline-primary btn-sm smn-cycle-detail-link" href={teamHref}>
            {t("detail.openTeam")} <BootstrapIcon name="arrow-right"/>
          </Link>}
      </div>
    </header>
    <div className="smn-metric-grid" role="group" aria-label={t("dashboard.cockpit.metrics")}>
      <KpiMetricPair title={t("dashboard.cockpit.capacity")}
        first={t("dashboard.cockpit.plannedCapacity")}
        second={t("dashboard.cockpit.actualCapacity")}
        unit="J/H" empty={emptyMetric}
        firstMetric={projection?.capacity.initialJh} secondMetric={projection?.capacity.actualJh}
        icon="people-fill" tone="capacity" ratioKey="dashboard.cockpit.capacityRatio"
        locale={locale} comparison={comparison}/>
      {canViewCapacity&&cycle&&cycle.status!=="closed"&&
       <Link href={"/app/admin/development-capacity?cycleId="+encodeURIComponent(cycle.id)}
         className="smn-capacity-diagnostic-link">
         {t("dashboard.cockpit.capacityDiagnosis")}
       </Link>}
      <KpiMetricPair title={t("dashboard.cockpit.storyPoints")}
        first={t("dashboard.cockpit.initialStoryPoints")}
        second={t("dashboard.cockpit.completedStoryPoints")}
        unit="SP" empty={emptyMetric}
        firstMetric={projection?.storyPoints.initial} secondMetric={projection?.storyPoints.done}
        spPerJh={scrum?{planned:projection?.capacity.initialJh,actual:projection?.capacity.actualJh}:undefined}
        icon="stack" tone="points" ratioKey="dashboard.cockpit.storyPointsRatio"
        locale={locale} comparison={comparison}/>
      <KpiMetricPair title={t("dashboard.cockpit.tickets")}
        first={t("dashboard.cockpit.initialTickets")}
        second={t("dashboard.cockpit.completedTickets")}
        unit={t("dashboard.cockpit.ticketsUnit")}
        firstMetric={projection?.tickets.initial} secondMetric={projection?.tickets.done}
        empty={emptyMetric} locale={locale}
        icon="ticket-perforated-fill" tone="tickets" ratioKey="dashboard.cockpit.ticketsRatio"
        comparison={comparison}/>
      <KpiDeadline locale={locale} metric={projection?.workingDaysRemaining}
        cycleExists={!!cycle} status={effectiveStatus}/>
      <KpiSprintScores locale={locale} scores={projection?.scores}/>
    </div>
  </section>;
}
