import {translate,type TranslationKey} from "@/i18n/catalog";
import type {Language} from "@/lib/language";
import Link from "next/link";
import {classifyEventStatus} from "@/server/dashboard/events-reader";
import type {CollectiveCycleProjection,DashboardAttention,DashboardEvent} from "@/lib/dashboard-data-contract";
import BootstrapIcon from "./bootstrap-icon";
import {dashboardEventIcon,formatDashboardEventPeriod,formatDashboardRegistryDate} from "@/lib/dashboard-card-format";
import OperationalQuickAdd from "./operational-quick-add";
import OperationalEdit from "./operational-edit";

type ColumnKind="obstacles"|"risks"|"events"|"notes";
type PanelDefinition=Readonly<{
  id:ColumnKind;
  title:TranslationKey;
  description:TranslationKey;
}>;

const createLabels:Readonly<Record<ColumnKind,TranslationKey>>={
  obstacles:"dashboard.operational.addObstacle",
  risks:"dashboard.operational.addRisk",
  events:"dashboard.operational.addEvent",
  notes:"dashboard.operational.addNote"
};
const createLabel=(locale:Language,kind:ColumnKind)=>translate(locale,createLabels[kind]);

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

function UnavailableColumn({definition,locale,teamId,cycleId,canManage}:Readonly<{definition:PanelDefinition;locale:Language;teamId?:string;cycleId?:string;canManage?:boolean}>){
  const t=(key:TranslationKey)=>translate(locale,key);
  const id="smn-operational-"+definition.id;
  return <section className={"smn-operational-panel smn-operational-"+definition.id+" smn-operational-compact"}
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
      {canManage&&cycleId&&teamId&&definition.id!=="events"?
       <OperationalQuickAdd kind={definition.id} teamId={teamId} cycleId={cycleId}
        label={createLabel(locale,definition.id)}/>:
       <span className="smn-operational-add-unavailable">{t("dashboard.operational.unavailable")}</span>}
    </footer>
  </section>;
}


/** Présentation uniquement : la priorité doit provenir d'un registre sauvegardé.
 * Un producteur manquant reste producer-not-ready ; jamais de sévérité déduite du titre. */
function PriorityMarker({priority,locale}:Readonly<{
 priority?: "low"|"medium"|"high"|null;locale:Language;
}>){
 const t=(key:TranslationKey)=>translate(locale,key);
 const value=priority??"unknown";
 const label:Record<typeof value,TranslationKey>={
  low:"dashboard.operational.priorityLow",
  medium:"dashboard.operational.priorityMedium",
  high:"dashboard.operational.priorityHigh",
  unknown:"dashboard.operational.priorityUnknown"
 };
 return <span className="smn-attention-priority" data-priority={value}>
  <span className="smn-attention-dot" aria-hidden="true"/>
  <span>{t(label[value])}</span>
 </span>;
}

function AttentionCard({item,locale,teamId,cycleId,canManage}:Readonly<{
 item:DashboardAttention;
 locale:Language;teamId:string;cycleId:string;canManage:boolean;
}>){
 const t=(key:TranslationKey)=>translate(locale,key);
 const icons={obstacle:"exclamation-octagon-fill",risk:"exclamation-triangle-fill",
  note:"sticky-fill",alert:"bell-fill"} as const;
 const labels:Record<DashboardAttention["kind"],TranslationKey>={
  obstacle:"dashboard.operational.obstacle",risk:"dashboard.operational.risk",
  note:"dashboard.operational.note",alert:"dashboard.operational.alert"
 };
 const tasks:Record<NonNullable<DashboardAttention["configurationKey"]>,{
  title:TranslationKey;description:TranslationKey;href:string;
 }>={
  "reference-country":{title:"configuration.tasks.referenceCountry.title",
   description:"configuration.tasks.referenceCountry.description",href:"/app/admin/settings"},
  "recovery-phrase":{title:"configuration.tasks.recoveryPhrase.title",
   description:"configuration.tasks.recoveryPhrase.description",href:"/app/security"},
  "display-preferences":{title:"configuration.tasks.displayPreferences.title",
   description:"configuration.tasks.displayPreferences.description",href:"/app/admin/settings"}
 };
 const statuses:Record<string,TranslationKey>={
  open:"registryCreate.open",in_progress:"registryCreate.in_progress",
  resolved:"registryCreate.resolved",abandoned:"registryCreate.abandoned",
  todo:"configuration.status.todo",done:"configuration.status.done"
 };
 const task=item.configurationKey?tasks[item.configurationKey]:null;
 const title=task?t(task.title):item.title;
 const description=task?t(task.description):item.description;
 const status=statuses[item.status]?t(statuses[item.status]):item.status;
 const href=task?.href??item.href;
 const severity=item.priority??"unknown";
 return <article className={"smn-attention-card smn-attention-"+item.kind}
    data-priority={severity} data-status={item.status}>
  <div className="smn-attention-card-heading">
   <span className="smn-attention-indicator" data-priority={severity} aria-hidden="true"/>
   <span className="smn-attention-kind-icon" aria-hidden="true"><BootstrapIcon name={icons[item.kind]}/></span>
   <span className="visually-hidden">{t(labels[item.kind])}</span>
   <h4 className="smn-attention-card-title"><OperationalEdit
    kind={item.configurationKey?"configuration":item.kind==="note"?"note":"registry"}
    id={item.id} title={title} teamId={teamId} cycleId={cycleId} canManage={canManage}
    status={item.status} configurationKey={item.configurationKey} href={href}
    className="smn-attention-card-title-button"/></h4>
  </div>
  {description&&<p className="smn-attention-card-description">{description}</p>}
  <div className="smn-attention-card-metadata">
   {item.kind!=="note"&&item.kind!=="alert"&&
    <PriorityMarker priority={item.priority} locale={locale}/>}
   {item.owner&&<span className="smn-attention-card-detail"><BootstrapIcon name="people-fill"/> {item.owner}</span>}
   {item.dueOn&&<span className="smn-attention-card-detail">
    <BootstrapIcon name="calendar-event"/> {formatDashboardRegistryDate(item.dueOn,locale)}
   </span>}
   {!item.dueOn&&item.occurredOn&&<span className="smn-attention-card-detail">
    {formatDashboardRegistryDate(item.occurredOn,locale)}
   </span>}
   <span className="smn-attention-card-status" data-status={item.status}>{status}</span>
   {item.scope==="team"&&<span className="smn-attention-card-detail">{t("dashboard.operational.unlinkedTeam")}</span>}
  </div>
 </article>;
}

/** Le registre dédié n'étant pas livré, « Voir tout » et « Ajouter »
 * demeurent informatifs, même quand un producteur de test sait lire des fiches. */
function AttentionColumn({definition,locale,collection,teamId,cycleId,canManage}:Readonly<{
 definition:PanelDefinition;locale:Language;
 collection:CollectiveCycleProjection["risks"];
 teamId:string;cycleId:string;canManage:boolean;
}>){
 if(collection.state==="unavailable")return <UnavailableColumn definition={definition} locale={locale} teamId={teamId} cycleId={cycleId} canManage={canManage}/>;
 const t=(key:TranslationKey,params?:Record<string,string|number>)=>translate(locale,key,params);
 const id="smn-operational-"+definition.id;
 return <section className={"smn-operational-panel smn-operational-"+definition.id+" smn-operational-compact"}
   aria-labelledby={id} id={definition.id==="obstacles"?"registres":undefined}>
  <header className="smn-operational-panel-header">
   <div className="smn-operational-title-wrap">
    <span className="smn-operational-icon" aria-hidden="true"><TopicIcon kind={definition.id}/></span>
    <h3 id={id}>{t(definition.title)}</h3>
   </div>
   <span className="smn-operational-count"
    aria-label={t("dashboard.operational.itemCount",{count:collection.total})}>{collection.total}</span>
   <p className="smn-operational-all-unavailable">
    {definition.id==="obstacles"||definition.id==="risks"?
     <Link href={"/app/admin/registries?type="+(definition.id==="obstacles"?"obstacle":"risk")}>{t("dashboard.operational.seeAll")}</Link>:
     <span>{t("dashboard.operational.seeAll")}</span>}
   </p>
  </header>
  <div className="smn-operational-content">
   {collection.items.length>0?
    <ol className="smn-attention-list">
     {collection.items.slice(0,5).map(item=>
      <li key={item.kind+":"+item.id}><AttentionCard item={item} locale={locale} teamId={teamId} cycleId={cycleId} canManage={canManage}/></li>)}
    </ol>:
    <div className="smn-operational-empty">
     <p className="smn-operational-empty-title">{t("dashboard.operational.empty")}</p>
    </div>}
  </div>
  <footer className="smn-operational-panel-footer">
   {canManage?<OperationalQuickAdd kind={definition.id} teamId={teamId} cycleId={cycleId}
    label={createLabel(locale,definition.id)}/>:
    <span className="smn-operational-add-unavailable">{t("dashboard.operational.unavailable")}</span>}
  </footer>
 </section>;
}

function EventsColumn({locale,events,teamId,cycleId,timeZone,canManage,cycleStatus}:Readonly<{
 locale:Language;events:CollectiveCycleProjection["events"];
 teamId:string;cycleId:string;timeZone:string;canManage:boolean;cycleStatus:string;
}>){
 const t=(key:TranslationKey,params?:Readonly<Record<string,string|number>>)=>translate(locale,key,params);
 const definition=PANELS.find(p=>p.id==="events")!;
 const base=new URLSearchParams({teamId,cycleId});
 const calendarHref="/app/team-calendar?"+base.toString();
 const ceremonyLabels:Readonly<Record<string,TranslationKey>>={
  planning:"sprintDetail.ceremonyKind.planning",
  daily:"sprintDetail.ceremonyKind.daily",
  review:"sprintDetail.ceremonyKind.review",
  retrospective:"sprintDetail.ceremonyKind.retrospective"
 };
 const eventTitle=(event:DashboardEvent):string=>
  event.kind==="ceremony"&&ceremonyLabels[event.title]?
   t(ceremonyLabels[event.title]):event.title;
 const labels:Record<ReturnType<typeof classifyEventStatus>,TranslationKey>={
  scheduled:"dashboard.operational.eventScheduled",
  held:"dashboard.operational.eventHeld",
  not_held:"dashboard.operational.eventNotHeld",
  cancelled:"dashboard.operational.eventCancelled",
  unknown:"dashboard.operational.eventUnknown"
 };
 return <section className="smn-operational-panel smn-operational-events smn-operational-compact"
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

     </p>
   </header>
   <div className="smn-operational-content">
     {events.state==="available"&&events.items.length>0?
      <ol className="smn-dashboard-events-list">
       {events.items.slice(0,5).map(event=><li key={event.kind+":"+event.id} className="smn-dashboard-event">
        <span className={"smn-dashboard-event-icon smn-dashboard-event-icon-"+dashboardEventIcon(event)}
           aria-hidden="true"><BootstrapIcon name={dashboardEventIcon(event)}/></span>
        <div className="smn-dashboard-event-body">
         <OperationalEdit kind="event" id={event.id} eventKind={event.kind}
           title={eventTitle(event)} teamId={teamId} cycleId={cycleId} timeZone={timeZone}
           canManage={canManage} className="smn-dashboard-event-title"
           href={"/app/team-calendar/meeting/"+encodeURIComponent(event.kind)+"/"+
            encodeURIComponent(event.id)+"?"+base.toString()}/>
         <span className="smn-dashboard-event-when">{formatDashboardEventPeriod(event.startsAt,event.endsAt,locale,timeZone)}</span>
         <span className="smn-dashboard-event-state">
           {t(labels[classifyEventStatus(event.status)])}
           {event.generationSource==="reconstructed"&&<> · {t("dashboard.operational.eventReconstructed")}</>}
         </span>
        </div>
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
     {canManage&&cycleStatus!=="closed"?
       <OperationalQuickAdd kind="events" teamId={teamId} cycleId={cycleId}
        label={createLabel(locale,"events")}/>:
       <span className="smn-operational-add-unavailable">{t("dashboard.operational.unavailable")}</span>}
   </footer>
 </section>;
}

/**
 * La colonne Événements utilise SMN-237. Les autres registres restent
 * indisponibles jusqu'à l'implémentation de leurs producteurs (SMN-238).
 */
export default function OperationalOverview({locale,projection,timeZone,canManage=false}:Readonly<{
 locale:Language;projection?:CollectiveCycleProjection|null;timeZone?:string;canManage?:boolean;
}>){
  const t=(key:TranslationKey)=>translate(locale,key);
  return <section className="smn-operational-overview" aria-label={t("dashboard.operational.heading")}>
    <div className="smn-operational-grid">
      {PANELS.map(definition=>{
        if(definition.id==="events"){
          return projection&&timeZone?
           <EventsColumn key="events" locale={locale} events={projection.events}
             teamId={projection.teamId} cycleId={projection.cycleId} timeZone={timeZone}
             cycleStatus={projection.cycleStatus} canManage={canManage}/>:
           <UnavailableColumn key="events" definition={definition} locale={locale}/>;
        }
        if(!projection)return <UnavailableColumn key={definition.id} definition={definition} locale={locale} canManage={canManage}/>;
        const collection=definition.id==="obstacles"?projection.obstacles:
          definition.id==="risks"?projection.risks:projection.notesAndAlerts;
        return <AttentionColumn key={definition.id} definition={definition}
          locale={locale} collection={collection} teamId={projection.teamId} cycleId={projection.cycleId} canManage={canManage}/>;
      })}
    </div>
  </section>;
}
