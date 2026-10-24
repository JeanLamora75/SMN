import {translate,type TranslationKey} from "@/i18n/catalog";
import type {Language} from "@/lib/language";
import Link from "next/link";
import {classifyEventStatus} from "@/server/dashboard/events-reader";
import type {CollectiveCycleProjection,DashboardAttention} from "@/lib/dashboard-data-contract";
import BootstrapIcon from "./bootstrap-icon";
import OperationalQuickAdd from "./operational-quick-add";

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

function AttentionCard({item,locale}:Readonly<{
 item:DashboardAttention;
 locale:Language;
}>){
 const t=(key:TranslationKey)=>translate(locale,key);
 const icons={
  obstacle:"exclamation-octagon-fill",
  risk:"exclamation-triangle-fill",
  note:"sticky-fill",
  alert:"bell-fill"
 } as const;
 const labels:Record<typeof item.kind,TranslationKey>={
  obstacle:"dashboard.operational.obstacle",
  risk:"dashboard.operational.risk",
  note:"dashboard.operational.note",
  alert:"dashboard.operational.alert"
 };
 return <article className={"smn-attention-card smn-attention-"+item.kind}>
  <div className="smn-attention-card-type">
   <BootstrapIcon name={icons[item.kind]}/>
   <span>{t(labels[item.kind])}</span>
  </div>
  <h4 className="smn-attention-card-title">{item.title}</h4>
  <div className="smn-attention-card-metadata">
   <PriorityMarker priority={item.priority} locale={locale}/>
   {item.status&&<span className="smn-attention-card-status">{item.status}</span>}
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
 return <section className={"smn-operational-panel smn-operational-"+definition.id}
   aria-labelledby={id} id={definition.id==="obstacles"?"registres":undefined}>
  <header className="smn-operational-panel-header">
   <div className="smn-operational-title-wrap">
    <span className="smn-operational-icon" aria-hidden="true"><TopicIcon kind={definition.id}/></span>
    <h3 id={id}>{t(definition.title)}</h3>
   </div>
   <span className="smn-operational-count"
    aria-label={t("dashboard.operational.itemCount",{count:collection.total})}>{collection.total}</span>
   <p className="smn-operational-all-unavailable">
    <span>{t("dashboard.operational.seeAll")}</span>
    <span className="smn-operational-status">{t("dashboard.operational.unavailable")}</span>
   </p>
  </header>
  <p className="smn-operational-description">{t(definition.description)}</p>
  <div className="smn-operational-content">
   {collection.items.length>0?
    <ol className="smn-attention-list">
     {collection.items.slice(0,5).map(item=>
      <li key={item.kind+":"+item.id}><AttentionCard item={item} locale={locale}/></li>)}
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
