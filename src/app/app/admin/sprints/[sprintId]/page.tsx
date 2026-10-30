import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readAccountDashboard} from "@/server/dashboard/read";
import {withDashboardRead} from "@/server/dashboard/read-only-db";
import {readSprintDetailGoals} from "@/server/sprints/goals-detail-read";
import {readSprintDetailIndicators} from "@/server/sprints/indicators-read";
import {readSprintCapacityKpiView} from "@/server/sprints/sprint-capacity-kpis";
import {readSprintDetailCeremonies} from "@/server/sprints/ceremonies-detail-read";
import {readSprintMemberPresence} from "@/server/sprints/presence-detail-read";
import {readSprintTrends} from "@/server/sprints/trends";
import {readSprintReview} from "@/server/sprints/review-analysis";
import {readSprintRegisters} from "@/server/sprints/registers-detail-read";
import {isRegisterKind} from "@/lib/sprint-registers";
import {readEpic5SprintRegisterSource} from "@/server/registries/sprint-adapter";
import {readSprintContext} from "@/server/sprints/context";
import {effectiveSprintStatus} from "@/lib/sprint-context";
import {requestLocale} from "@/i18n/locale.server";
import {translate,type TranslationKey} from "@/i18n/catalog";
import BootstrapIcon from "../../../bootstrap-icon";
import SprintDetailEditor from "./sprint-detail-editor";
import SprintDetailTabs from "./sprint-detail-tabs";
import SprintGoalsPanel from "./sprint-goals-panel";
import SprintIndicatorsPanel from "./sprint-indicators-panel";
import SprintCeremoniesPanel from "./sprint-ceremonies-panel";
import HistoricalEventForm from "./historical-event-form";
import HistoricalPartialForm from "./historical-partial-form";
import SprintCapacityPanel from "./sprint-capacity-panel";
import SprintTrendsPanel from "./sprint-trends-panel";
import SprintReviewPanel from "./sprint-review-panel";
import SprintRegistersPanel from "./sprint-registers-panel";
import {parseSprintTab,type SprintTab} from "@/lib/sprint-detail-tabs";
import "./sprint-detail-cockpit.css";

export const dynamic="force-dynamic";

/** A Sprint identity is always resolved server-side in the authorized team's scope. */
export default async function SprintDetailPage({params,searchParams}:{
 params:Promise<{sprintId:string}>;
 searchParams:Promise<{tab?:string|string[];page?:string|string[];kind?:string|string[];teamId?:string|string[]}>;
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
 const pageParam=typeof requested.page==="string"?requested.page:"1";
 const ceremonyPage=/^[1-9]\d{0,6}$/.test(pageParam)?Number(pageParam):1;
 const registerKind=typeof requested.kind==="string"&&isRegisterKind(requested.kind)?
  requested.kind:null;
 const requestedTeamId=typeof requested.teamId==="string"?requested.teamId:null;
 const dashboard=await withAuthDb(db=>readAccountDashboard(db,
  {accountId:account.id,role:account.role},requestedTeamId)).catch(()=>null);
 if(!dashboard)return <main className="container-fluid px-3 px-lg-4 py-4">
  <div role="alert" className="alert alert-warning">
   {t("dashboard.cockpit.sprintDetailUnavailable")}
  </div>
  <Link href="/app">{t("dashboard.cockpit.backToDashboard")}</Link>
 </main>;
 const teamId=dashboard.context.teamId;
 const canViewMembers=canAccess(account,"read",{type:"members",exists:true,inScope:true});
 const result=await withDashboardRead(async db=>{
  const context=await readSprintContext(db,teamId);
  const cycle=context.items.find(item=>item.id===sprintId);
  if(!cycle)return null;
  const goals=active==="objectives"?await readSprintDetailGoals(db,teamId,cycle.id):null;
  const indicators=active==="indicators"?await readSprintDetailIndicators(db,teamId,cycle.id):null;
  const capacityKpis=active==="indicators"?await readSprintCapacityKpiView(db,teamId,cycle):null;
  const ceremonies=active==="ceremonies"?await readSprintDetailCeremonies(db,teamId,cycle.id,ceremonyPage):null;
  const presence=active==="capacity"&&canViewMembers?
   await readSprintMemberPresence(db,teamId,cycle):null;
  const trends=active==="trends"?await readSprintTrends(db,cycle.id,teamId):null;
  const review=active==="review"?await readSprintReview(db,teamId,cycle.id):null;
  const registers=active==="registers"?await readSprintRegisters(db,teamId,cycle,ceremonyPage,readEpic5SprintRegisterSource,registerKind):null;
  return {cycle,goals,indicators,capacityKpis,ceremonies,presence,trends,review,registers};
 }).catch(()=>undefined);
 if(result===null)notFound();
 if(!result)return <main className="container-fluid px-3 px-lg-4 py-4">
  <div role="alert" className="alert alert-warning">
   {t("dashboard.cockpit.sprintDetailUnavailable")}
  </div>
  <Link href="/app">{t("dashboard.cockpit.backToDashboard")}</Link>
 </main>;
 const {cycle,goals,indicators,capacityKpis,ceremonies,presence,trends,review,registers}=result;
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
 const commonProps={
  sprintId:cycle.id,name:cycle.name,startAt:cycle.startAt,
  endAt:cycle.endAt,timeZone:cycle.timeZone
 };
 return <main className="smn-page container-fluid px-3 px-lg-4 py-4 smn-sprint-detail smn-sprint-detail-cockpit">
  <div className="smn-sprint-detail-hero mb-3">
   <header className="d-flex justify-content-between align-items-start flex-wrap gap-3">
    <div className="flex-grow-1" style={{minWidth:0}}>
     <p className="smn-cycle-eyebrow mb-1">{t("dashboard.cockpit.sprintDetailsTitle")}</p>
     <div className="d-flex align-items-center flex-wrap gap-2">
      <h1 className="h4 mb-0 text-break">{cycle.name}</h1>
      {canManage&&<SprintDetailEditor kind="name" {...commonProps}/>}
     </div>
     <div className="smn-sprint-hero-meta d-flex flex-wrap align-items-center gap-3 mt-2">
      <span className="smn-sprint-team-name">{dashboard.context.product} · {dashboard.context.team}</span>
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
    </div>
    <div className="d-flex gap-2 align-items-center flex-wrap">{canManage&&<Link className="btn btn-outline-primary btn-sm" href={"/app/admin/ai-briefs/prepare?"+new URLSearchParams({mode:"scrum",id:cycle.id}).toString()}>Générer un brief IA</Link>}{canManage&&<Link className="btn btn-outline-primary btn-sm" href={"/app/admin/sprints/"+encodeURIComponent(cycle.id)+"/report"}>{t("sprintReportPrepare.launch")}</Link>}
    <span className="smn-sprint-status-pill" title={t("sprintDetail.statusHelp")}>
     {t(statusKeys[status]??"dashboard.cockpit.notAvailable")}
    </span></div>
   </header>
  </div>
  <div className="smn-sprint-detail-content">
   <SprintDetailTabs sprintId={cycle.id} teamId={teamId} active={active}
    labels={labels} navLabel={t("dashboard.cockpit.sprintDetailsTitle")}/>
   <section role="tabpanel" tabIndex={0} id="smn-sprint-detail-panel"
    aria-labelledby={"smn-sprint-tab-"+active} className="pt-4">
    {active==="objectives"?<><SprintGoalsPanel
      sprintId={cycle.id} teamId={teamId} status={cycle.status} canManage={canManage}
      data={goals??{state:"unavailable",reason:"read-failed"}}/>{canManage&&cycle.status==="finished"&&<HistoricalPartialForm sprintId={cycle.id}/>}</>:
     active==="indicators"?<><SprintIndicatorsPanel
      sprintId={cycle.id} teamId={teamId} status={cycle.status} canManage={canManage}
      data={indicators??{state:"unavailable",reason:"read-failed"}}
      capacityKpis={capacityKpis??{state:"unavailable",reason:"read-failed"}}/></> :
     active==="ceremonies"?<><SprintCeremoniesPanel
      sprintId={cycle.id} teamId={teamId} timeZone={cycle.timeZone} locale={locale}
      canManage={canManage&&cycle.status!=="closed"}
      t={(key,params)=>translate(locale,key,params)}
      data={ceremonies??{state:"unavailable",reason:"read-failed"}}/>{canManage&&cycle.status==="finished"&&<HistoricalEventForm sprintId={cycle.id}/>}</>:
     active==="capacity"?<SprintCapacityPanel
      teamId={teamId} canViewNames={canViewMembers} data={canViewMembers?presence:null} locale={locale}
      t={(key,params)=>translate(locale,key,params)}/>:
     active==="trends"?<SprintTrendsPanel
      data={trends} locale={locale}
      t={(key,params)=>translate(locale,key,params)}/>:
     active==="review"?<SprintReviewPanel
      data={review} sprintId={cycle.id} status={cycle.status}
      canManage={canManage} locale={locale} timeZone={cycle.timeZone}/>:
     active==="registers"?<SprintRegistersPanel
      sprintId={cycle.id} teamId={teamId} timeZone={cycle.timeZone} locale={locale}
      canManage={canManage&&cycle.status!=="closed"} selectedKind={registerKind}
      data={registers??{state:"unavailable",reason:"read-failed"}}
      t={(key,params)=>translate(locale,key,params)}/>:
      <div className="py-3" role="status">
     <p className="fw-semibold mb-1">{t("sprintDetail.availableLater")}</p>
     <p className="text-secondary mb-0">{t(waiting[active])}</p>
    </div>}
   </section>
  </div>
 </main>;
}
