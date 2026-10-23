import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readCollectiveDashboard} from "@/server/dashboard/read";
import {withDashboardRead} from "@/server/dashboard/read-only-db";
import {readCycleDashboard} from "@/server/dashboard/cycle-reader";
import {readSprintContext} from "@/server/sprints/context";
import {effectiveSprintStatus} from "@/lib/sprint-context";
import {requestLocale} from "@/i18n/locale.server";
import {translate,type TranslationKey} from "@/i18n/catalog";
import BootstrapIcon from "../../../bootstrap-icon";
import SprintDetailEditor from "./sprint-detail-editor";
import SprintDetailTabs from "./sprint-detail-tabs";
import {parseSprintTab,type SprintTab} from "@/lib/sprint-detail-tabs";

export const dynamic="force-dynamic";

/** A Sprint identity is always resolved server-side in the authorized team's scope. */
export default async function SprintDetailPage({params,searchParams}:{
 params:Promise<{sprintId:string}>;
 searchParams:Promise<{tab?:string|string[]}>;
}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 const collective={type:"collective",exists:true,inScope:true} as const;
 if(!canAccess(account,"read",collective))redirect("/app");
 const locale=await requestLocale();
 const t=(key:TranslationKey)=>translate(locale,key);
 const {sprintId}=await params;
 const requested=await searchParams;
 const active=parseSprintTab(typeof requested.tab==="string"?requested.tab:undefined);
 const dashboard=await withAuthDb(readCollectiveDashboard).catch(()=>null);
 if(!dashboard)return <main className="container-fluid px-3 px-lg-4 py-4">
  <div role="alert" className="alert alert-warning">
   {t("dashboard.cockpit.sprintDetailUnavailable")}
  </div>
  <Link href="/app">{t("dashboard.cockpit.backToDashboard")}</Link>
 </main>;
 const teamId=dashboard.context.teamId;
 const result=await withDashboardRead(async db=>{
  const context=await readSprintContext(db,teamId);
  const cycle=context.items.find(item=>item.id===sprintId);
  if(!cycle)return null;
  const projection=await readCycleDashboard(db,teamId,cycle);
  return {cycle,projection};
 }).catch(()=>undefined);
 if(result===null)notFound();
 if(!result)return <main className="container-fluid px-3 px-lg-4 py-4">
  <div role="alert" className="alert alert-warning">
   {t("dashboard.cockpit.sprintDetailUnavailable")}
  </div>
  <Link href="/app">{t("dashboard.cockpit.backToDashboard")}</Link>
 </main>;
 const {cycle,projection}=result;
 const canManage=canAccess(account,"write",{type:"settings",exists:true,inScope:true});
 const status=effectiveSprintStatus(cycle);
 const statusKeys:Record<string,TranslationKey>={
  planned:"sprintStates.planned",active:"sprintStates.active",
  finished:"sprintStates.finished",closed:"sprintStates.closed",
  suspended:"sprintStates.suspended"
 };
 const day=(date:Date)=>new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone:cycle.timeZone,day:"numeric",month:"long",year:"numeric"
 }).format(date);
 const start=new Date(cycle.startAt),end=new Date(Date.parse(cycle.endAt)-1);
 const dashboardHref="/app?"+new URLSearchParams({teamId,cycleId:cycle.id}).toString();
 const labels:Record<SprintTab,string>={
  objectives:t("sprintDetail.tabs.objectives"),
  ceremonies:t("sprintDetail.tabs.ceremonies"),
  capacity:t("sprintDetail.tabs.capacity"),
  indicators:t("sprintDetail.tabs.indicators"),
  registers:t("sprintDetail.tabs.registers"),
  trends:t("sprintDetail.tabs.trends"),
  review:t("sprintDetail.tabs.review")
 };
 const waiting:Record<Exclude<SprintTab,"objectives">,TranslationKey>={
  ceremonies:"sprintDetail.pendingCeremonies",
  capacity:"sprintDetail.pendingCapacity",
  indicators:"sprintDetail.pendingIndicators",
  registers:"sprintDetail.pendingRegisters",
  trends:"sprintDetail.pendingTrends",
  review:"sprintDetail.pendingReview"
 };
 const goals=projection.goals;
 const commonProps={
  sprintId:cycle.id,name:cycle.name,startAt:cycle.startAt,
  endAt:cycle.endAt,timeZone:cycle.timeZone
 };
 return <main className="container-fluid px-3 px-lg-4 py-4 smn-sprint-detail">
  <nav aria-label={t("dashboard.cockpit.sprintDetailsTitle")}
   className="d-flex gap-3 flex-wrap align-items-center mb-3">
   <Link className="d-inline-flex align-items-center gap-2"
    href="/app/admin/sprints">
    <BootstrapIcon name="arrow-left"/>{t("sprintDetail.backSprints")}
   </Link>
   <Link href={dashboardHref}>{t("dashboard.cockpit.backToDashboard")}</Link>
  </nav>
  <div className="smn-panel rounded-4 p-3 p-md-4 mb-3">
   <header className="d-flex justify-content-between align-items-start flex-wrap gap-3">
    <div className="flex-grow-1" style={{minWidth:0}}>
     <p className="smn-cycle-eyebrow mb-1">{t("dashboard.cockpit.sprintDetailsTitle")}</p>
     <div className="d-flex align-items-center flex-wrap gap-2">
      <h1 className="h4 mb-0 text-break">{cycle.name}</h1>
      {canManage&&<SprintDetailEditor kind="name" {...commonProps}/>}
     </div>
     <p className="small text-secondary mt-2 mb-2">
      {dashboard.context.product} · {dashboard.context.team}
     </p>
     <div className="d-flex flex-wrap align-items-center gap-2 small">
      <BootstrapIcon name="calendar3"/>
      <time dateTime={start.toISOString()}>{day(start)}</time>
      <span aria-hidden="true">—</span>
      <time dateTime={end.toISOString()}>{day(end)}</time>
      {canManage&&cycle.status!=="closed"&&
       <SprintDetailEditor kind="dates" {...commonProps}/>}
      <span className="text-secondary">({cycle.timeZone})</span>
     </div>
    </div>
    <span className="badge text-bg-secondary" title={t("sprintDetail.statusHelp")}>
     {t(statusKeys[status]??"dashboard.cockpit.notAvailable")}
    </span>
   </header>
  </div>
  <div className="smn-panel rounded-4 p-3 p-md-4">
   <SprintDetailTabs sprintId={cycle.id} active={active}
    labels={labels} navLabel={t("dashboard.cockpit.sprintDetailsTitle")}/>
   <section role="tabpanel" tabIndex={0} id="smn-sprint-detail-panel"
    aria-labelledby={"smn-sprint-tab-"+active} className="pt-4">
    {active==="objectives"?<>
     <h2 className="h5 d-flex align-items-center gap-2 mb-3">
      <BootstrapIcon name="bullseye"/>{t("dashboard.cockpit.allSprintGoals")}
     </h2>
     {goals.state==="available"&&goals.items.length>0?
      <ul className="list-group list-group-flush">
       {goals.items.map(goal=><li key={goal.id}
        className="list-group-item bg-transparent d-flex flex-wrap justify-content-between gap-2 px-0">
        <span>{goal.title}</span>
        <span className="text-secondary small">
         {t(("sprintGoals."+goal.evaluation) as TranslationKey)}
        </span>
       </li>)}
      </ul>:
      <p className="text-secondary">
       {goals.state==="available"?t("dashboard.cockpit.goalNotSpecified"):
        t("dashboard.cockpit.notAvailable")}
      </p>}
     <p className="small text-secondary mt-3 mb-0">{t("sprintDetail.pendingObjectives")}</p>
    </>:<div className="py-3" role="status">
     <p className="fw-semibold mb-1">{t("sprintDetail.availableLater")}</p>
     <p className="text-secondary mb-0">{t(waiting[active])}</p>
    </div>}
   </section>
  </div>
 </main>;
}
