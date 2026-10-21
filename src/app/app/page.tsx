import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { withAuthDb } from "@/server/auth/database";
import { canAccess } from "@/server/access-policy";
import { readCollectiveDashboard } from "@/server/dashboard/read";
import ConfigurationChecklist from "./configuration-checklist";
import CycleOverview from "./cycle-overview";
import {readConfigurationChecklist} from "@/server/configuration/tasks";
import {requestLocale} from "@/i18n/locale.server";
import {translate,type TranslationKey} from "@/i18n/catalog";
import {dashboardReturnPath,teamDetailPath,type DashboardQuery} from "@/lib/context-navigation";

export const dynamic = "force-dynamic";

function EmptyBlock({ heading, description, symbol, unavailable }: Readonly<{
  heading: string; description: string; symbol: string; unavailable: string;
}>) {
  return <article className="smn-dashboard-card h-100">
    <div className="d-flex justify-content-between align-items-start gap-3">
      <span className="smn-card-icon" aria-hidden="true">{symbol}</span>
      <span className="smn-not-available">{unavailable}</span>
    </div>
    <h3 className="h6 fw-bold mt-4">{heading}</h3>
    <p className="small text-secondary mb-0">{description}</p>
  </article>;
}

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
  const returnTo=dashboardReturnPath(await searchParams,context.teamId);
  const teamHref=teamDetailPath(context.teamId,returnTo);

  return <>
    <CycleOverview context={context} locale={locale} teamHref={teamHref}/>

    {/* L'agenda et les registres métier seront intégrés aux quatre colonnes du lot 3. */}
    <section className="mt-4" id="calendrier" aria-labelledby="calendar-heading">
      <div className="smn-section-title">
        <h2 className="h5 fw-bold mb-0" id="calendar-heading">{t("dashboard.events")}</h2>
      </div>
      <EmptyBlock unavailable={t("dashboard.unavailable")} symbol="▦"
        heading={t("dashboard.events")} description={t("dashboard.eventsDesc")}/>
    </section>

          <div className="row g-4 mt-2">
            <section className="col-12 col-xl-7" id="registres" aria-labelledby="attention-heading">
              <div className="smn-section-title">
                <div>
                  <div className="smn-eyebrow">{t("dashboard.visibility")}</div>
                  <h2 className="h5 fw-bold mb-0" id="attention-heading">{t("dashboard.nav.attention")}</h2>
                </div>
              </div>
              <div className="smn-dashboard-card smn-attention-card">
                <div className="smn-card-icon mb-3" aria-hidden="true">◇</div>
                <h3 className="h6 fw-bold">{t("dashboard.attentionTitle")}</h3>
                <p className="small text-secondary mb-3">{t("dashboard.attentionDesc")}</p>
                <span className="smn-inline-note">{t("dashboard.noFake")}</span>
              </div>
            </section>
            <section className="col-12 col-xl-5" id="reportings" aria-labelledby="reporting-heading">
              <div className="smn-section-title">
                <div>
                  <div className="smn-eyebrow">{t("dashboard.sharing")}</div>
                  <h2 className="h5 fw-bold mb-0" id="reporting-heading">{t("dashboard.nav.reports")}</h2>
                </div>
              </div>
              <div className="smn-dashboard-card smn-attention-card">
                <div className="smn-card-icon mb-3" aria-hidden="true">▤</div>
                <h3 className="h6 fw-bold">{t("dashboard.noReport")}</h3>
                <p className="small text-secondary mb-3">{t("dashboard.reportDesc")}</p>
                <span className="smn-inline-note">{t("dashboard.future")}</span>
              </div>
            </section>
          </div>

          {configuration&&<ConfigurationChecklist initial={configuration}/>}

          <footer className="smn-dashboard-footer">
            <span>{t("dashboard.footer")}</span>
            <span>{t("dashboard.footerHint")}</span>
          </footer>

  </>;
}
