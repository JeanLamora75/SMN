import Link from "next/link";
import type {TranslationKey} from "@/i18n/catalog";
import {sprintDetailPath} from "@/lib/sprint-detail-path";
import {
 registerKinds,
 type RegisterKind,type SprintRegisterResult
} from "@/lib/sprint-registers";
import BootstrapIcon from "../../../bootstrap-icon";
import SprintRegisterRow from "./sprint-register-row";

type Text=(key:TranslationKey,params?:Readonly<Record<string,string|number>>)=>string;
const statusKeys:Readonly<Record<string,TranslationKey>>={
 open:"registryCreate.open",in_progress:"registryCreate.in_progress",
 resolved:"registryCreate.resolved",abandoned:"registryCreate.abandoned",
 satisfied:"registryCreate.satisfied",cancelled:"registryCreate.cancelled",
 active:"registryCreate.active",replaced:"registryCreate.replaced",
 todo:"registryCreate.todo",completed:"registryCreate.completed",
 recorded:"registryCreate.recorded"
};
const priorityKeys:Readonly<Record<string,TranslationKey>>={
 low:"dashboard.operational.priorityLow",medium:"dashboard.operational.priorityMedium",
 high:"dashboard.operational.priorityHigh"
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
export default function SprintRegistersPanel({sprintId,teamId,timeZone,locale,data,t,
 selectedKind=null,canManage=false}:{
 sprintId:string;teamId:string;timeZone:string;locale:"fr"|"en";
 selectedKind?:RegisterKind|null;canManage?:boolean;
 data:SprintRegisterResult|null;t:Text;
}){
 const dates=new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone,dateStyle:"medium"
 });
 const stamp=(iso:string)=>dates.format(new Date(iso));
 const url=(page:number,kind=selectedKind)=>sprintDetailPath(sprintId)+"?"+
  new URLSearchParams({tab:"registers",page:String(page),...(kind?{kind}:{})}).toString();
 const missing=data?.state==="available"?data.missingKinds:[...registerKinds];
 return <section className="smn-sprint-registers" aria-label={t("sprintDetail.tabs.registers")}>
  <h2 className="h5 mb-2">{t("sprintDetail.tabs.registers")}</h2>
  <p className="small text-secondary mb-3">
   {t("sprintDetail.registersIntroduction")}
  </p>
  <nav className="d-flex flex-wrap gap-2 mb-3 smn-sprint-register-filters" aria-label={t("sprintDetail.registersCategories")}>
   <Link href={url(1,null)} aria-current={selectedKind===null?"page":undefined}
    className={"badge border text-decoration-none "+(selectedKind===null?"text-bg-primary":"text-bg-light")}>
    {t("sprintDetail.registersAll")}
   </Link>
   {registerKinds.map(kind=><Link key={kind} href={url(1,kind)}
    aria-current={selectedKind===kind?"page":undefined}
    className={"badge border d-inline-flex align-items-center gap-1 text-decoration-none "+
     (selectedKind===kind?"text-bg-primary":"text-bg-light")}>
    <BootstrapIcon name={icons[kind]}/> {t(categoryKeys[kind])}
   </Link>)}
  </nav>
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
    <ol className="list-group list-group-flush mb-3 smn-sprint-register-list"
     start={(data.page-1)*data.pageSize+1}>
     {data.items.map(item=><SprintRegisterRow key={item.kind+":"+item.id}
      item={item} teamId={teamId} canManage={canManage}
      historical={data.source==="closure-snapshot"}
      typeLabel={t(categoryKeys[item.kind])}
      statusLabel={item.status===null?null:
       statusKeys[item.status]?t(statusKeys[item.status]):item.status}
      priorityLabel={item.priority===null?null:
       t("sprintDetail.registersPriority",{value:priorityKeys[item.priority]?
        t(priorityKeys[item.priority]):item.priority})}
      dateLabel={t("sprintDetail.registersDate")}
      formattedDate={stamp(item.date)}/>)}
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
