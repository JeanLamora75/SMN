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
import {sprintDetailPath} from "@/lib/sprint-detail-path";

export const dynamic="force-dynamic";

/** Première fiche Sprint : vraie consultation collective, extensible sans
 * inventer des actions ou un modèle de données avant les US correspondantes. */
export default async function SprintDetailPage({params}:{
 params:Promise<{sprintId:string}>;
}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))
  redirect("/app");
 const locale=await requestLocale();
 const t=(key:TranslationKey)=>translate(locale,key);
 const {sprintId}=await params;
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
 const goals=projection.goals;
 return <main className="container-fluid px-3 px-lg-4 py-4 smn-sprint-detail">
  <Link className="d-inline-flex gap-2 align-items-center mb-3"
   href={dashboardHref}>
   <BootstrapIcon name="arrow-left"/>{t("dashboard.cockpit.backToDashboard")}
  </Link>
  <div className="smn-panel p-3 p-md-4">
   <header className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
    <div>
     <p className="smn-cycle-eyebrow">{t("dashboard.cockpit.sprintDetailsTitle")}</p>
     <h1 className="h3 mb-2">{cycle.name}</h1>
     <p className="text-secondary mb-0">
      {dashboard.context.product} · {dashboard.context.team}
     </p>
    </div>
    <span className="badge text-bg-secondary">{t(statusKeys[status]??"dashboard.cockpit.notAvailable")}</span>
   </header>
   <dl className="row g-3 mb-3">
    <div className="col-md-6">
     <dt>{t("dashboard.cockpit.dates")}</dt>
     <dd><BootstrapIcon name="calendar3" className="me-2"/>
      <time dateTime={start.toISOString()}>{day(start)}</time> — 
      <time dateTime={end.toISOString()}>{day(end)}</time>
     </dd>
    </div>
    <div className="col-md-6">
     <dt>{t("dashboard.cockpit.status")}</dt>
     <dd>{t(statusKeys[status]??"dashboard.cockpit.notAvailable")}</dd>
    </div>
   </dl>
   <section aria-labelledby="smn-sprint-detail-goals" className="border-top pt-3">
    <h2 id="smn-sprint-detail-goals" className="h5 d-flex gap-2 align-items-center">
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
   </section>
   <p className="small text-secondary mb-0 mt-3">
    {t("dashboard.cockpit.sprintDetailIntro")}
   </p>
  </div>
 </main>;
}
