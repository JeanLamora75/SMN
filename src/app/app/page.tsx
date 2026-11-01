import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { withAuthDb } from "@/server/auth/database";
import { canAccess } from "@/server/access-policy";
import { readAccountDashboard } from "@/server/dashboard/read";
import CycleOverview from "./cycle-overview";
import OperationalOverview from "./operational-overview";
import MemberConfigurationAlerts from "./member-configuration-alerts";
import {requestLocale} from "@/i18n/locale.server";
import {translate,type TranslationKey} from "@/i18n/catalog";
import {dashboardReturnPath,teamDetailPath,type DashboardQuery} from "@/lib/context-navigation";
import {withDashboardRead} from "@/server/dashboard/read-only-db";
import {readCycleDashboard} from "@/server/dashboard/cycle-reader";
import {readSprintContext} from "@/server/sprints/context";
import {selectedSprint} from "@/lib/sprint-context";

export const dynamic = "force-dynamic";

export default async function DashboardPage({searchParams}:{searchParams:Promise<DashboardQuery>}) {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (!canAccess(account, "read", { type: "collective", exists: true, inScope: true }))
    redirect("/change-password");
  const locale=await requestLocale();
  const t=(key:TranslationKey,params?:Record<string,string|number>)=>translate(locale,key,params);

  let dashboard: Awaited<ReturnType<typeof readAccountDashboard>>;
  try {
    const query=await searchParams;
    dashboard = await withAuthDb(db=>readAccountDashboard(db,
      {accountId:account.id,role:account.role},
      typeof query.teamId==="string"?query.teamId:null));
  } catch {
    return <div className="py-5">
      <section className="smn-panel p-4" role="alert">
        <h1 className="h4">{t("dashboard.unavailableTitle")}</h1>
        <p>{t("dashboard.unavailableDescription")}</p>
        <Link className="btn btn-outline-primary" href="/app">{t("dashboard.retry")}</Link>
      </section>
    </div>;
  }

  const { context } = dashboard;
  const query=await searchParams;
  const returnTo=dashboardReturnPath(query,context.teamId);
  const teamHref=teamDetailPath(context.teamId,returnTo);
  const requested=typeof query.cycleId==="string"?query.cycleId:null;
  // Un seul snapshot PostgreSQL pour la sélection du Sprint ET ses KPI.
  const sprintResult=context.mode==="scrum"?await withDashboardRead(async db=>{
    const sprintData=await readSprintContext(db,context.teamId);
    // Un cycle historique demandé ne doit jamais être réinterprété dans une autre équipe.
    if(requested&&!sprintData.items.some(item=>item.id===requested))
      throw Error("cycle-out-of-team");
    const cycle=selectedSprint(sprintData.items,requested);
    const projection=cycle?await readCycleDashboard(db,context.teamId,cycle,account.role==="admin"):null;
    return {cycle,projection};
  }).catch(()=>null):{cycle:null,projection:null};
  const cycle=sprintResult?.cycle??null;
  const projection=sprintResult?.projection??null;

  return <>
    {account.role==="admin"&&<MemberConfigurationAlerts/>}
    {sprintResult===null&&<p role="alert" className="alert alert-warning">
      {t("sprintsIndex.error")}
    </p>}
    {sprintResult!==null&&<>
      <CycleOverview context={context} locale={locale} teamHref={teamHref} cycle={cycle} projection={projection}
       canViewCapacity={canAccess(account,"read",{type:"members",exists:true,inScope:true})}
       />

      <OperationalOverview locale={locale} projection={projection} timeZone={cycle?.timeZone} canManage={account.role==="admin"}/>
    </>}


    <footer className="smn-dashboard-footer">
      <span>{t("dashboard.footer")}</span>
      <span>{t("dashboard.footerHint")}</span>
    </footer>

  </>;
}
