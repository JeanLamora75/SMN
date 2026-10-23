import Link from "next/link";
import BootstrapIcon from "../../../bootstrap-icon";
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
const meetingPath=(item:SprintCeremony)=>"/app/team-calendar/meeting/"+
 (item.source==="standard"?"ceremony":item.source==="custom"?"template":"exceptional")+
 "/"+encodeURIComponent(item.id);
const badge=(status:CeremonyStatus)=>status==="held"?"text-bg-success":
 status==="not_held"?"text-bg-warning":status==="cancelled"?"text-bg-secondary":
 status==="scheduled"?"text-bg-primary":"text-bg-light";
function kindIcon(item:SprintCeremony):"calendar-event"|"people-fill"|"bell-fill"|
 "calendar3"|"bullseye"|"sticky-fill"{
 if(item.source==="custom")return "people-fill";
 if(item.source==="exceptional")return "bell-fill";
 if(item.kind==="daily")return "calendar3";
 if(item.kind==="review")return "bullseye";
 if(item.kind==="retrospective")return "sticky-fill";
 return "calendar-event";
}
export default function SprintCeremoniesPanel({sprintId,timeZone,locale,data,t}:{
 sprintId:string;timeZone:string;locale:"fr"|"en";data:SprintCeremoniesResult;t:Text;
}){
 const dateFormat=new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone,dateStyle:"medium",timeStyle:"short"
 });
 const date=(iso:string)=>dateFormat.format(new Date(iso));
 const minutes=(value:number|null)=>value===null?t("sprintDetail.ceremonyNotRecorded"):
  t("sprintDetail.ceremonyMinutes",{minutes:value});
 const href=(page:number)=>sprintDetailPath(sprintId)+"?"+
  new URLSearchParams({tab:"ceremonies",page:String(page)}).toString();
 return <div>
  <h2 className="h5 mb-2">{t("sprintDetail.tabs.ceremonies")}</h2>
  <p className="small text-secondary">{t("sprintDetail.ceremonyIntro")}</p>
  {data.state==="unavailable"?<div className="alert alert-warning" role="status">
   {t(data.reason==="history-missing"?
    "sprintDetail.ceremonyHistoryMissing":"sprintDetail.ceremonyUnavailable")}
  </div>:<>
   <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
    <p className="mb-0 fw-semibold">
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
    <ol className="list-group list-group-flush mb-3" start={(data.page-1)*data.pageSize+1}>
     {data.items.map(item=><li key={item.source+":"+item.id}
      className="list-group-item bg-transparent px-0 py-3">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
       <div className="d-flex align-items-start gap-3 flex-grow-1" style={{minWidth:0}}>
        <span className="text-secondary mt-1"><BootstrapIcon name={kindIcon(item)}/></span>
        <div className="flex-grow-1" style={{minWidth:0}}>
         <p className="mb-1 fw-semibold text-break">
          {item.source==="standard"&&item.kind&&typeKey[item.kind]?
           t(typeKey[item.kind]):item.title}
         </p>
         <p className="small text-secondary mb-2">{t(sourceKey[item.source])}</p>
         <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
          <span className={"badge "+badge(item.status)}>{t(statusKey[item.status])}</span>
          {item.status==="held"&&item.statusEvidence==="inferred"&&
           <span className="badge text-bg-info">{t("sprintDetail.ceremonyInferred")}</span>}
          {item.status==="held"&&item.statusEvidence==="unknown"&&
           <span className="badge text-bg-light">{t("sprintDetail.ceremonyUnverified")}</span>}
          {item.reconstructed&&<span className="badge text-bg-light">
           {t("sprintDetail.ceremonyReconstructed")}
          </span>}
         </div>
         <dl className="row g-2 small mb-0">
          <div className="col-12 col-md-6">
           <dt>{t("sprintDetail.ceremonyWhen")}</dt>
           <dd className="mb-0">
            <time dateTime={item.startsAt}>{date(item.startsAt)}</time> —{" "}
            <time dateTime={item.endsAt}>{date(item.endsAt)}</time>
           </dd>
          </div>
          <div className="col-6 col-md-3">
           <dt>{t("sprintDetail.ceremonyPlannedDuration")}</dt>
           <dd className="mb-0">{minutes(item.plannedMinutes)}</dd>
          </div>
          <div className="col-6 col-md-3">
           <dt>{t("sprintDetail.ceremonyActualDuration")}</dt>
           <dd className="mb-0">{minutes(item.actualMinutes)}</dd>
          </div>
         </dl>
        </div>
       </div>
       {data.source==="recorded-events"?
        <Link className="btn btn-outline-primary btn-sm" href={meetingPath(item)}>
         {t("sprintDetail.ceremonyViewMeeting")}
        </Link>:
        <span className="small text-secondary" role="note">
         {t("sprintDetail.ceremonyHistoricalLinkUnavailable")}
        </span>}
      </div>
     </li>)}
    </ol>}
   {data.pageCount>1&&<nav aria-label={t("sprintDetail.ceremonyPages")}>
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
     {data.page>1?<Link className="btn btn-outline-secondary btn-sm"
      href={href(data.page-1)}>{t("sprintDetail.ceremonyPrevious")}</Link>:
      <span/>}
     <span className="small">
      {t("sprintDetail.ceremonyPageCount",{page:data.page,total:data.pageCount})}
     </span>
     {data.page<data.pageCount?<Link className="btn btn-outline-secondary btn-sm"
      href={href(data.page+1)}>{t("sprintDetail.ceremonyNext")}</Link>:<span/>}
    </div>
   </nav>}
   <p className="small text-secondary mt-3 mb-0">
    {t("sprintDetail.ceremonyStatusHelp")}
   </p>
  </>}
 </div>;
}
