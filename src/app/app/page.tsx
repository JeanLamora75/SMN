import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { withAuthDb } from "@/server/auth/database";
import { canAccess } from "@/server/access-policy";
import { readCollectiveDashboard } from "@/server/dashboard/read";
import ConfigurationChecklist from "./configuration-checklist";
import CycleOverview from "./cycle-overview";
import OperationalOverview from "./operational-overview";
import {readConfigurationChecklist} from "@/server/configuration/tasks";
import {requestLocale} from "@/i18n/locale.server";
import {translate,type TranslationKey} from "@/i18n/catalog";
import {dashboardReturnPath,teamDetailPath,type DashboardQuery} from "@/lib/context-navigation";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
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

  let dashboard: Awaited<ReturnType<typeof readCollectiveDashboard>>;
  try {
    dashboard = await withAuthDb(readCollectiveDashboard);
  } catch {
    return <div className="py-5">
      <section className="smn-panel p-4" role="alert">
        <h1 className="h4">{t("dashboard.unavailableTitle")}</h1>
        <p>{t("dashboard.unavailableDescription")}</p>
        <Link className="btn btn-outline-primary" href="/app">{t("dashboard.retry")}</Link>
      </section>
    </div>;
  }

  const canManageConfiguration=canAccess(account,"read",{type:"settings",exists:true,inScope:true});
  const configuration=canManageConfiguration
    ? await withAuthDb(readConfigurationChecklist).catch(()=>null) : null;
  const { context } = dashboard;
  const query=await searchParams;
  const returnTo=dashboardReturnPath(query,context.teamId);
  const teamHref=teamDetailPath(context.teamId,returnTo);
  const sprintData=context.mode==="scrum"
    ? await withSprintIndexDb(db=>readSprintContext(db,context.teamId)).catch(()=>null)
    : {items:[],defaultCycleId:null};
  const requested=typeof query.cycleId==="string"?query.cycleId:null;
  const cycle=selectedSprint(sprintData?.items??[],requested);

  return <>
    {sprintData===null&&<p role="alert" className="alert alert-warning">
      {t("sprintsIndex.error")}
    </p>}
    <CycleOverview context={context} locale={locale} teamHref={teamHref} cycle={cycle}/>

    <OperationalOverview locale={locale}/>

    <div className="container mb-4">
      <Link href="/app/team-calendar" className="btn btn-outline-primary">
        {t("teamCalendar.open")}
      </Link>
    </div>

    {configuration&&<ConfigurationChecklist initial={configuration}/>}

    <footer className="smn-dashboard-footer">
      <span>{t("dashboard.footer")}</span>
      <span>{t("dashboard.footerHint")}</span>
    </footer>

  </>;
}
