import Link from "next/link";
import {translate,type TranslationKey} from "@/i18n/catalog";
import type {Language} from "@/lib/language";
import type {DashboardContext} from "@/server/dashboard/read";

type Props=Readonly<{
  context:DashboardContext;
  locale:Language;
  teamHref:string;
}>;

function MetricLine({label,unit,empty}:Readonly<{label:string;unit:string;empty:string}>){
  return <div className="smn-metric-row">
    <dt className="smn-metric-label">{label} <span className="smn-metric-unit">({unit})</span></dt>
    <dd className="smn-metric-empty">{empty}</dd>
  </div>;
}

function MetricPair({title,first,second,unit,empty,comparison}:Readonly<{
  title:string;first:string;second:string;unit:string;empty:string;comparison:string;
}>){
  return <article className="smn-metric-card">
    <h2 className="smn-metric-title">{title}</h2>
    <dl className="smn-metric-values">
      <MetricLine label={first} unit={unit} empty={empty}/>
      <MetricLine label={second} unit={unit} empty={empty}/>
    </dl>
    <p className="smn-metric-comparison">{comparison}</p>
  </article>;
}

/**
 * L'installation actuelle ne dispose pas encore de producteur de cycles,
 * d'engagements initiaux ni de capacités : aucune valeur n'est déduite du contexte.
 */
export default function CycleOverview({context,locale,teamHref}:Props){
  const t=(key:TranslationKey)=>translate(locale,key);
  const scrum=context.mode==="scrum";
  return <section className="smn-cycle-overview" id="pilotage"
    aria-labelledby="smn-cycle-overview-heading">
    <header className="smn-cycle-overview-header" id="cycles">
      <div className="smn-cycle-headline">
        <p className="smn-cycle-eyebrow">
          {t(scrum?"dashboard.sprint":"dashboard.kanbanCycle")}
        </p>
        <h1 id="smn-cycle-overview-heading">{t("dashboard.cockpit.noCycle")}</h1>
        <p className="smn-cycle-context">
          <strong>{context.product}</strong>
          <span aria-hidden="true"> · </span>
          <span>{context.team}</span>
        </p>
        <p className="smn-cycle-description">
          {t(scrum?"dashboard.cockpit.noSprintHelp":"dashboard.cockpit.noPeriodHelp")}
        </p>
        <Link className="btn btn-outline-primary btn-sm smn-cycle-team-link" href={teamHref}>
          {t("detail.openTeam")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="smn-cycle-facts" role="group" aria-label={t("dashboard.cockpit.details")}>
        <dl className="smn-cycle-fact-list">
          <div><dt>{t("dashboard.cockpit.dates")}</dt>
            <dd>{t("dashboard.cockpit.notAvailable")}</dd></div>
          <div><dt>{t("dashboard.cockpit.status")}</dt>
            <dd>{t("dashboard.cockpit.noCycle")}</dd></div>
          <div><dt>{t("dashboard.cockpit.goals")}</dt>
            <dd>{t("dashboard.cockpit.notSpecified")}</dd></div>
        </dl>
      </div>
    </header>
    <div className="smn-metric-grid" role="group" aria-label={t("dashboard.cockpit.metrics")}>
      <MetricPair title={t("dashboard.cockpit.capacity")}
        first={t("dashboard.cockpit.plannedCapacity")}
        second={t("dashboard.cockpit.actualCapacity")}
        unit="J/H" empty={t("dashboard.cockpit.notSpecified")}
        comparison={t("dashboard.cockpit.noPreviousCycle")}/>
      <MetricPair title={t("dashboard.cockpit.storyPoints")}
        first={t("dashboard.cockpit.initialStoryPoints")}
        second={t("dashboard.cockpit.completedStoryPoints")}
        unit="SP" empty={t("dashboard.cockpit.notSpecified")}
        comparison={t("dashboard.cockpit.noPreviousCycle")}/>
      <MetricPair title={t("dashboard.cockpit.tickets")}
        first={t("dashboard.cockpit.initialTickets")}
        second={t("dashboard.cockpit.completedTickets")}
        unit={t("dashboard.cockpit.ticketsUnit")}
        empty={t("dashboard.cockpit.notSpecified")}
        comparison={t("dashboard.cockpit.noPreviousCycle")}/>
      <article className="smn-metric-card smn-metric-deadline">
        <h2 className="smn-metric-title">{t("dashboard.cockpit.workingDays")}</h2>
        <p className="smn-deadline-unavailable">{t("dashboard.cockpit.notCalculable")}</p>
        <p className="smn-deadline-explanation">{t("dashboard.cockpit.workingDaysHelp")}</p>
      </article>
    </div>
  </section>;
}
