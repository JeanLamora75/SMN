import {translate,type TranslationKey} from "@/i18n/catalog";
import type {Language} from "@/lib/language";
import Link from "next/link";
import {classifyEventStatus} from "@/server/dashboard/events-reader";
import type {CollectiveCycleProjection} from "@/lib/dashboard-data-contract";

type ColumnKind="obstacles"|"risks"|"events"|"notes";
type PanelDefinition=Readonly<{
  id:ColumnKind;
  title:TranslationKey;
  description:TranslationKey;
}>;

const PANELS:readonly PanelDefinition[]=[
  {id:"obstacles",title:"dashboard.operational.obstacles",description:"dashboard.operational.obstaclesHelp"},
  {id:"risks",title:"dashboard.operational.risks",description:"dashboard.operational.risksHelp"},
  {id:"events",title:"dashboard.operational.events",description:"dashboard.operational.eventsHelp"},
  {id:"notes",title:"dashboard.operational.notesAlerts",description:"dashboard.operational.notesHelp"},
];

/** Icônes décoratives ; chaque type reste identifiable par son libellé en texte. */
function TopicIcon({kind}:Readonly<{kind:ColumnKind|"note"|"alert"}>){
  let shape;
  switch(kind){
    case "obstacles":
      shape=<><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path d="M12 7v6M12 17h.01"/></>;
      break;
    case "risks":
    case "alert":
      shape=<><path d="M12 3 2 21h20L12 3z"/><path d="M12 9v5M12 18h.01"/></>;
      break;
    case "events":
      shape=<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>;
      break;
    case "notes":
    case "note":
      shape=<><path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M15 2v6h5M8 13h8M8 17h6"/></>;
      break;
  }
  return <svg viewBox="0 0 24 24" width="20" height="20"
    fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {shape}
  </svg>;
}

function UnavailableColumn({definition,locale}:Readonly<{definition:PanelDefinition;locale:Language}>){
  const t=(key:TranslationKey)=>translate(locale,key);
  const id="smn-operational-"+definition.id;
  return <section className={"smn-operational-panel smn-operational-"+definition.id}
    aria-labelledby={id} id={definition.id==="events"?"calendrier":definition.id==="obstacles"?"registres":undefined}>
    <header className="smn-operational-panel-header">
      <div className="smn-operational-title-wrap">
        <span className="smn-operational-icon" aria-hidden="true"><TopicIcon kind={definition.id}/></span>
        <h3 id={id}>{t(definition.title)}</h3>
      </div>
      <span className="smn-operational-count"
        aria-label={t("dashboard.operational.countUnavailable")}>
        <span aria-hidden="true">—</span>
      </span>
      <p className="smn-operational-all-unavailable">
        <span>{t("dashboard.operational.seeAll")}</span>
        <span className="smn-operational-status">{t("dashboard.operational.unavailable")}</span>
      </p>
    </header>
    <p className="smn-operational-description">{t(definition.description)}</p>
    <div className="smn-operational-content">
      <div className="smn-operational-empty">
        <p className="smn-operational-empty-title">{t("dashboard.operational.empty")}</p>
        <p className="smn-operational-empty-description">
          {t("dashboard.operational.sourceUnavailable")}
        </p>
      </div>
      {definition.id==="notes"&&
        <div className="smn-operational-types" aria-label={t("dashboard.operational.types")}>
          <span className="smn-operational-type smn-operational-type-note">
            <TopicIcon kind="note"/>{t("dashboard.operational.note")}
          </span>
          <span className="smn-operational-type smn-operational-type-alert">
            <TopicIcon kind="alert"/>{t("dashboard.operational.alert")}
          </span>
        </div>}
    </div>
    <footer className="smn-operational-panel-footer">
      <span className="smn-operational-add-unavailable">
        {t("dashboard.operational.add")} · {t("dashboard.operational.unavailable")}
      </span>
    </footer>
  </section>;
}

function EventsColumn({locale,events,teamId,cycleId,timeZone}:Readonly<{
 locale:Language;events:CollectiveCycleProjection["events"];
 teamId:string;cycleId:string;timeZone:string;
}>){
 const t=(key:TranslationKey)=>translate(locale,key);
 const definition=PANELS.find(p=>p.id==="events")!;
 const base=new URLSearchParams({teamId,cycleId});
 const calendarHref="/app/team-calendar?"+base.toString();
 const labels:Record<ReturnType<typeof classifyEventStatus>,TranslationKey>={
  scheduled:"dashboard.operational.eventScheduled",
  held:"dashboard.operational.eventHeld",
  cancelled:"dashboard.operational.eventCancelled",
  unknown:"dashboard.operational.eventUnknown"
 };
 const time=(date:string)=>{
  try{return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
   timeZone,day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"
  }).format(new Date(date));}
  catch{return t("dashboard.operational.unavailable");}
 };
 return <section className="smn-operational-panel smn-operational-events"
   aria-labelledby="smn-operational-events" id="calendrier">
   <header className="smn-operational-panel-header">
     <div className="smn-operational-title-wrap">
       <span className="smn-operational-icon" aria-hidden="true"><TopicIcon kind="events"/></span>
       <h3 id="smn-operational-events">{t(definition.title)}</h3>
     </div>
     <span className="smn-operational-count"
       aria-label={events.state==="available"?
         t("dashboard.operational.eventCount",{count:events.total}):
         t("dashboard.operational.countUnavailable")}>
       {events.state==="available"?events.total:"—"}
     </span>
     <p className="smn-operational-all-unavailable">
       <Link href={calendarHref}>{t("dashboard.operational.seeAll")}</Link>
       <span className="smn-operational-status">
         {events.state==="available"?t("dashboard.operational.eventAvailable"):t("dashboard.operational.unavailable")}
       </span>
     </p>
   </header>
   <p className="smn-operational-description">{t(definition.description)}</p>
   <div className="smn-operational-content">
     {events.state==="available"&&events.items.length>0?
      <ol className="smn-dashboard-events-list">
       {events.items.map(event=><li key={event.kind+":"+event.id} className="smn-dashboard-event">
        <Link className="smn-dashboard-event-title"
          href={"/app/team-calendar/meeting/"+encodeURIComponent(event.kind)+"/"+
           encodeURIComponent(event.id)+"?"+base.toString()}>
          {event.title}
        </Link>
        <span className="smn-dashboard-event-when">{time(event.startsAt)} — {time(event.endsAt)}</span>
        <span className="smn-dashboard-event-state">
          {t(labels[classifyEventStatus(event.status)])}
          {event.generationSource==="reconstructed"&&
           <> · {t("dashboard.operational.eventReconstructed")}</>}
        </span>
       </li>)}
      </ol>:
      <div className="smn-operational-empty">
       <p className="smn-operational-empty-title">
         {events.state==="available"?t("dashboard.operational.empty"):t("dashboard.operational.unavailable")}
       </p>
       {events.state==="unavailable"&&<p className="smn-operational-empty-description">
         {t("dashboard.operational.sourceUnavailable")}
       </p>}
      </div>}
   </div>
   <footer className="smn-operational-panel-footer">
     <Link className="smn-operational-calendar-link" href={calendarHref}>
       {t("dashboard.operational.openCalendar")}
     </Link>
   </footer>
 </section>;
}

/**
 * La colonne Événements utilise SMN-237. Les autres registres restent
 * indisponibles jusqu'à l'implémentation de leurs producteurs (SMN-238).
 */
export default function OperationalOverview({locale,projection,timeZone}:Readonly<{
 locale:Language;projection?:CollectiveCycleProjection|null;timeZone?:string;
}>){
  const t=(key:TranslationKey)=>translate(locale,key);
  return <section className="smn-operational-overview" aria-labelledby="smn-operational-heading">
    <div className="smn-operational-overview-heading">
      <h2 id="smn-operational-heading">{t("dashboard.operational.heading")}</h2>
      <p>{t("dashboard.operational.subtitle")}</p>
    </div>
    <div className="smn-operational-grid">
      {PANELS.map(definition=>definition.id==="events"&&projection&&timeZone?
        <EventsColumn key="events" locale={locale} events={projection.events}
          teamId={projection.teamId} cycleId={projection.cycleId} timeZone={timeZone}/>:
        <UnavailableColumn key={definition.id} definition={definition} locale={locale}/>)}
    </div>
  </section>;
}
