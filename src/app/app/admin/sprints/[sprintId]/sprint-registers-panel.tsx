import Link from "next/link";
import type {TranslationKey} from "@/i18n/catalog";
import {sprintDetailPath} from "@/lib/sprint-detail-path";
import {
 registerKinds,safeRegisterHref,
 type RegisterKind,type SprintRegisterResult
} from "@/lib/sprint-registers";
import BootstrapIcon from "../../../bootstrap-icon";

type Text=(key:TranslationKey,params?:Readonly<Record<string,string|number>>)=>string;
const statusKeys:Readonly<Record<string,TranslationKey>>={
 open:"registryCreate.open",in_progress:"registryCreate.in_progress",
 resolved:"registryCreate.resolved",abandoned:"registryCreate.abandoned",
 satisfied:"registryCreate.satisfied",cancelled:"registryCreate.cancelled",
 active:"registryCreate.active",replaced:"registryCreate.replaced",
 todo:"registryCreate.todo",completed:"registryCreate.completed",
 recorded:"registryCreate.recorded"
};
const categoryKeys:Record<RegisterKind,TranslationKey>={
 risk:"sprintDetail.registerRisk",
 obstacle:"sprintDetail.registerObstacle",
 dependency:"sprintDetail.registerDependency",
 decision:"sprintDetail.registerDecision",
 action:"sprintDetail.registerAction",
 highlight:"sprintDetail.registerHighlight"
};
const icons:Record<RegisterKind,
 "exclamation-octagon-fill"|"exclamation-triangle-fill"|"stack"|
 "bullseye"|"ticket-perforated-fill"|"bell-fill">={
 risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
 dependency:"stack",decision:"bullseye",
 action:"ticket-perforated-fill",highlight:"bell-fill"
};

/** No figures, links or fabricated records are rendered without a provider.
 * The component can render future verified Epic 5 data through its contract. */
export default function SprintRegistersPanel({sprintId,timeZone,locale,data,t}:{
 sprintId:string;timeZone:string;locale:"fr"|"en";
 data:SprintRegisterResult|null;t:Text;
}){
 const dates=new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone,dateStyle:"medium",timeStyle:"short"
 });
 const stamp=(iso:string)=>dates.format(new Date(iso));
 const url=(page:number)=>sprintDetailPath(sprintId)+"?"+
  new URLSearchParams({tab:"registers",page:String(page)}).toString();
 const missing=data?.state==="available"?data.missingKinds:[...registerKinds];
 return <section aria-label={t("sprintDetail.tabs.registers")}>
  <h2 className="h5 mb-2">{t("sprintDetail.tabs.registers")}</h2>
  <p className="small text-secondary mb-3">
   {t("sprintDetail.registersIntroduction")}
  </p>
  <div className="d-flex flex-wrap gap-2 mb-3" aria-label={t("sprintDetail.registersCategories")}>
   {registerKinds.map(kind=><span key={kind}
    className="badge text-bg-light border d-inline-flex align-items-center gap-1">
    <BootstrapIcon name={icons[kind]}/> {t(categoryKeys[kind])}
   </span>)}
  </div>
  {data===null||data.state==="unavailable"?
   <div role="status" className="alert alert-warning mb-0">
    {t(data?.state==="unavailable"&&data.reason==="history-missing"?
     "sprintDetail.registersHistoryMissing":
     data?.state==="unavailable"&&data.reason==="producer-not-installed"?
     "sprintDetail.registersProducerPending":"sprintDetail.registersUnavailable")}
   </div>:<>
   <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
    <p className="fw-semibold mb-0">{t("sprintDetail.registersCount",{count:data.total})}</p>
    <span className="small text-secondary">{data.source==="closure-snapshot"?
     t("sprintDetail.registersSnapshot",{version:data.snapshotVersion??"?"}):
     t("sprintDetail.registersCurrent")}</span>
   </div>
   {missing.length>0&&<div role="status" className="alert alert-warning">
    {t("sprintDetail.registersPartial",{
     types:missing.map(kind=>t(categoryKeys[kind])).join(", ")
    })}
   </div>}
   {data.total===0?
    <p role="status" className="text-secondary">{missing.length===0?
     t("sprintDetail.registersNoRecords"):
     t("sprintDetail.registersNoRecordsPartial")}</p>:
    <ol className="list-group list-group-flush mb-3"
     start={(data.page-1)*data.pageSize+1}>
     {data.items.map(item=><li key={item.kind+":"+item.id}
      className="list-group-item bg-transparent px-0 py-3">
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
       <div className="d-flex gap-3 align-items-start flex-grow-1" style={{minWidth:0}}>
        <span className="text-secondary"><BootstrapIcon name={icons[item.kind]}/></span>
        <div className="flex-grow-1" style={{minWidth:0}}>
         <p className="small text-secondary mb-1">{t(categoryKeys[item.kind])}</p>
         <p className="fw-semibold mb-1 text-break">{data.source==="current"&&safeRegisterHref(item.href)?
          <Link href={item.href!}>{item.title}</Link>:item.title}</p>
         <div className="d-flex flex-wrap align-items-center gap-2 small mb-2">
          {item.status!==null&&<span className="badge text-bg-secondary">
           {statusKeys[item.status]?t(statusKeys[item.status]):item.status}
          </span>}
          {item.priority!==null&&<span className="badge text-bg-light border">
           {t("sprintDetail.registersPriority",{value:item.priority})}
          </span>}
         </div>
         <p className="small text-secondary mb-0">
          {t("sprintDetail.registersDate")}:{" "}
          <time dateTime={item.date}>{stamp(item.date)}</time>
         </p>
        </div>
       </div>
       {data.source==="closure-snapshot"?
        <span className="small text-secondary" role="note">
         {t("sprintDetail.registersHistoricalLinkUnavailable")}
        </span>:
        safeRegisterHref(item.href)?
        <Link href={item.href!} className="btn btn-outline-primary btn-sm">
         {t("sprintDetail.registersOpenRecord")}
        </Link>:
        <span className="small text-secondary">
         {t("sprintDetail.registersNoLink")}
        </span>}
      </div>
     </li>)}
    </ol>}
   {data.pageCount>1&&<nav aria-label={t("sprintDetail.registersPagination")}
    className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
    {data.page>1?<Link className="btn btn-outline-secondary btn-sm"
     href={url(data.page-1)}>{t("sprintDetail.registersPrevious")}</Link>:<span/>}
    <span className="small">{t("sprintDetail.registersPage",{
     page:data.page,total:data.pageCount})}</span>
    {data.page<data.pageCount?<Link className="btn btn-outline-secondary btn-sm"
     href={url(data.page+1)}>{t("sprintDetail.registersNext")}</Link>:<span/>}
   </nav>}
  </>}
 </section>;
}
