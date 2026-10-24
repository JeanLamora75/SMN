import Link from "next/link";
import BootstrapIcon from "../../../bootstrap-icon";
import OperationalEdit from "../../../operational-edit";
import {dashboardEventIcon,formatDashboardEventPeriod} from "@/lib/dashboard-card-format";
import {sprintDetailPath} from "@/lib/sprint-detail-path";
import type {TranslationKey} from "@/i18n/catalog";
import type {SprintCeremoniesResult} from "@/server/sprints/ceremonies-detail-read";
import type {SprintCeremony,CeremonySource,CeremonyStatus} from "@/lib/sprint-ceremony-detail";

type Text=(key:TranslationKey,params?:Readonly<Record<string,string|number>>)=>string;
const statusKey:Record<CeremonyStatus,TranslationKey>={
 scheduled:"sprintDetail.ceremonyStatus.scheduled",
 held:"sprintDetail.ceremonyStatus.held",
 not_held:"sprintDetail.ceremonyStatus.notHeld",
 cancelled:"sprintDetail.ceremonyStatus.cancelled",
 unknown:"sprintDetail.ceremonyStatus.unknown"
};
const sourceKey:Record<CeremonySource,TranslationKey>={
 standard:"sprintDetail.ceremonySource.standard",
 custom:"sprintDetail.ceremonySource.custom",
 exceptional:"sprintDetail.ceremonySource.exceptional"
};
const typeKey:Record<string,TranslationKey>={
 planning:"sprintDetail.ceremonyKind.planning",
 daily:"sprintDetail.ceremonyKind.daily",
 review:"sprintDetail.ceremonyKind.review",
 retrospective:"sprintDetail.ceremonyKind.retrospective"
};
const badge=(status:CeremonyStatus)=>status==="held"?"text-bg-success":
 status==="not_held"?"text-bg-warning":status==="cancelled"?"text-bg-secondary":
 status==="scheduled"?"text-bg-primary":"text-bg-light";
const eventKind=(source:CeremonySource)=>source==="standard"?"ceremony":
 source==="custom"?"template":"exceptional";
const iconFor=(item:SprintCeremony)=>dashboardEventIcon({
 kind:eventKind(item.source),
 title:item.kind??item.title
});
const minutes=(value:number|null,t:Text)=>value===null?t("sprintDetail.ceremonyNotRecorded"):
 t("sprintDetail.ceremonyMinutes",{minutes:value});

/** One semantic row per recorded ceremony; its snapshot is never edited. */
export default function SprintCeremoniesPanel({sprintId,teamId,timeZone,locale,canManage,data,t}:{
 sprintId:string;teamId:string;timeZone:string;locale:"fr"|"en";
 canManage:boolean;data:SprintCeremoniesResult;t:Text;
}){
 const href=(page:number)=>sprintDetailPath(sprintId)+"?"+
  new URLSearchParams({tab:"ceremonies",page:String(page)}).toString();
 return <div className="smn-sprint-ceremonies">
  <h2 className="h5 mb-2">{t("sprintDetail.tabs.ceremonies")}</h2>
  <p className="small text-secondary mb-2">{t("sprintDetail.ceremonyIntro")}</p>
  {data.state==="unavailable"?<div className="alert alert-warning" role="status">
   {t(data.reason==="history-missing"?
    "sprintDetail.ceremonyHistoryMissing":"sprintDetail.ceremonyUnavailable")}
  </div>:<>
   <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-2">
    <p className="mb-0 fw-semibold small">
     {t("sprintDetail.ceremonyCount",{count:data.total})}
    </p>
    <span className="small text-secondary">
     {data.snapshotVersion!==null?t("sprintDetail.ceremonySnapshot",{version:data.snapshotVersion}):
      t("sprintDetail.ceremonyCurrent")}
    </span>
   </div>
   {data.missingSources.length>0&&<div role="status" className="alert alert-warning">
    {t("sprintDetail.ceremonyPartialSources",{
     sources:data.missingSources.map(source=>t(sourceKey[source])).join(", ")
    })}
   </div>}
   {data.total===0?<p className="text-secondary">{t("sprintDetail.ceremonyEmpty")}</p>:
    <ol className="list-group list-group-flush mb-3 smn-sprint-ceremony-list"
     start={(data.page-1)*data.pageSize+1}>
     {data.items.map(item=>{
      const icon=iconFor(item);
      const label=item.source==="standard"&&item.kind&&typeKey[item.kind]?
       t(typeKey[item.kind]):item.title;
      return <li key={item.source+":"+item.id}
       className={"list-group-item bg-transparent smn-sprint-ceremony-row smn-sprint-ceremony-"+icon}>
       <span className={"smn-sprint-ceremony-icon smn-sprint-ceremony-icon-"+icon}
        aria-hidden="true"><BootstrapIcon name={icon}/></span>
       <div className="smn-sprint-ceremony-fields">
        <div className="smn-sprint-ceremony-name">
         <p className="mb-0 fw-semibold text-break">{label}</p>
         <div className="smn-sprint-ceremony-flags">
          <span className={"badge "+badge(item.status)}>{t(statusKey[item.status])}</span>
          {item.status==="held"&&item.statusEvidence==="inferred"&&
           <span className="badge text-bg-info">{t("sprintDetail.ceremonyInferred")}</span>}
          {item.status==="held"&&item.statusEvidence==="unknown"&&
           <span className="badge text-bg-light">{t("sprintDetail.ceremonyUnverified")}</span>}
          {item.reconstructed&&<span className="badge text-bg-light">
           {t("sprintDetail.ceremonyReconstructed")}
          </span>}
          <span className="text-secondary smn-sprint-ceremony-source">{t(sourceKey[item.source])}</span>
         </div>
        </div>
        <div className="smn-sprint-ceremony-datum smn-sprint-ceremony-period">
         <span className="smn-sprint-ceremony-label">{t("sprintDetail.ceremonyWhen")}</span>
         <time dateTime={item.startsAt}>{formatDashboardEventPeriod(
          item.startsAt,item.endsAt,locale,timeZone)}</time>
        </div>
        <div className="smn-sprint-ceremony-datum smn-sprint-ceremony-planned">
         <span className="smn-sprint-ceremony-label">{t("sprintDetail.ceremonyPlannedDuration")}</span>
         <span>{minutes(item.plannedMinutes,t)}</span>
        </div>
        <div className="smn-sprint-ceremony-datum smn-sprint-ceremony-actual">
         <span className="smn-sprint-ceremony-label">{t("sprintDetail.ceremonyActualDuration")}</span>
         <span>{minutes(item.actualMinutes,t)}</span>
        </div>
        <div className="smn-sprint-ceremony-action">
         {data.source==="recorded-events"&&canManage?
          <OperationalEdit kind="event" eventKind={eventKind(item.source)}
           id={item.id} title={label} teamId={teamId} cycleId={sprintId}
           timeZone={timeZone} canManage={canManage} actionIcon
           className="smn-sprint-ceremony-edit"/>:
          data.source==="closure-snapshot"?
           <span className="visually-hidden">{t("sprintDetail.ceremonyHistoricalLinkUnavailable")}</span>:
           null}
        </div>
       </div>
      </li>;
     })}
    </ol>}
   {data.pageCount>1&&<nav aria-label={t("sprintDetail.ceremonyPages")}>
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
     {data.page>1?<Link className="btn btn-outline-secondary btn-sm"
      href={href(data.page-1)}>{t("sprintDetail.ceremonyPrevious")}</Link>:
      <span/>}
     <span className="small">{t("sprintDetail.ceremonyPageCount",{
      page:data.page,total:data.pageCount})}</span>
     {data.page<data.pageCount?<Link className="btn btn-outline-secondary btn-sm"
      href={href(data.page+1)}>{t("sprintDetail.ceremonyNext")}</Link>:<span/>}
    </div>
   </nav>}
   <p className="small text-secondary mt-3 mb-0">{t("sprintDetail.ceremonyStatusHelp")}</p>
  </>}
 </div>;
}
