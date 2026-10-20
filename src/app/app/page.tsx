import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { withAuthDb } from "@/server/auth/database";
import { canAccess } from "@/server/access-policy";
import { readCollectiveDashboard } from "@/server/dashboard/read";
import ConfigurationChecklist from "./configuration-checklist";
import {readConfigurationChecklist} from "@/server/configuration/tasks";
import {requestLocale} from "@/i18n/locale.server";
import {translate,type TranslationKey} from "@/i18n/catalog";

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

export default async function DashboardPage() {
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
    return <main className="container py-5">
      <section className="smn-panel p-4" role="alert">
        <h1 className="h4">{t("dashboard.unavailableTitle")}</h1>
        <p>{t("dashboard.unavailableDescription")}</p>
        <Link className="btn btn-outline-primary" href="/app">{t("dashboard.retry")}</Link>
        <div className="mt-3"><LogoutControl/></div>
      </section>
    </main>;
  }

  const canManageConfiguration=canAccess(account,"read",{type:"settings",exists:true,inScope:true});
  const configuration=canManageConfiguration
    ? await withAuthDb(readConfigurationChecklist).catch(()=>null) : null;
  const { context } = dashboard;
  const scrum = context.mode === "scrum";
  const cycleName=t(scrum?"dashboard.sprint":"dashboard.kanbanCycle");

  return <>

          <div id="pilotage" className="smn-dashboard-heading">
            <div>
              <div className="smn-eyebrow">{t("dashboard.management")} <span className="smn-heading-separator">/</span> {t("dashboard.dashboard")}</div>
              <h1 className="smn-dashboard-title">{t("dashboard.overviewTitle")}</h1>
              <p className="text-secondary mb-0">{t("dashboard.overviewDesc")}</p>
            </div>
            <span className="smn-pilot-label">{t("dashboard.mode",{mode:scrum?"Scrum":"Kanban"})}</span>
          </div>

          <section className="smn-context-card" aria-labelledby="context-heading">
            <div className="smn-context-main">
              <div className="smn-context-overline">{t("dashboard.workspaceTitle")}</div>
              <h2 id="context-heading">{context.product}</h2>
              <p className="mb-0 smn-context-team">
                <span className="smn-context-circle" aria-hidden="true">◉</span> {t("dashboard.team",{team:context.team})}
              </p>
            </div>
            <div className="smn-context-meta">
              <div className="smn-context-label">{t("dashboard.framework")}</div>
              <div className="fw-semibold">{scrum?"Scrum":"Kanban"}</div>
              <div className="smn-context-label mt-3">{t("dashboard.currentCycle")}</div>
              <div className="fw-semibold">{t("dashboard.unavailable")}</div>
            </div>
          </section>

          {configuration&&<ConfigurationChecklist initial={configuration}/>}

          <section className="mt-4" id="cycles" aria-labelledby="cycle-heading">
            <div className="smn-section-title">
              <div>
                <div className="smn-eyebrow">{t("dashboard.cadence")}</div>
                <h2 className="h5 fw-bold mb-0" id="cycle-heading">{t("dashboard.nav.cycles")}</h2>
              </div>
              <span className="smn-section-meta">{t("dashboard.teamMeta",{team:context.team})}</span>
            </div>
            <div className="smn-dashboard-card smn-cycle-empty">
              <div className="smn-cycle-symbol" aria-hidden="true">◷</div>
              <div className="flex-grow-1">
                <h3 className="h6 fw-bold mb-2">{t("dashboard.noCycle",{cycle:cycleName.toLowerCase()})}</h3>
                <p className="text-secondary mb-2">{t("dashboard.noCycleIntro",{cycles:t(scrum?"dashboard.sprintCycles":"dashboard.kanbanCycles")})}</p>
                <span className="smn-inline-note">{t("dashboard.noAutoCycle")}</span>
              </div>
              <span className="smn-coming-soon" title={t("dashboard.comingTitle")}>
                {t("dashboard.coming")}
              </span>
            </div>
            <div className="smn-pending-cycle mt-3">
              <span className="fw-semibold">{t("dashboard.pending")}</span>
              <span className="text-secondary">{t("dashboard.pendingInfo")}</span>
            </div>
          </section>

          <section className="mt-5" aria-labelledby="summary-heading">
            <div className="smn-section-title">
              <div>
                <div className="smn-eyebrow">{t("dashboard.summary")}</div>
                <h2 className="h5 fw-bold mb-0" id="summary-heading">{t("dashboard.essential")}</h2>
              </div>
              <span className="smn-section-meta">{t("dashboard.real")}</span>
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-6 col-xl-4">
                <EmptyBlock unavailable={t("dashboard.unavailable")} symbol="◎" heading={t("dashboard.goals")} description={t("dashboard.goalsDesc")}/>
              </div>
              <div className="col-12 col-md-6 col-xl-4">
                <EmptyBlock unavailable={t("dashboard.unavailable")} symbol="▥" heading={t("dashboard.metrics")} description={t("dashboard.metricsDesc")}/>
              </div>
              <div className="col-12 col-md-6 col-xl-4" id="calendrier">
                <EmptyBlock unavailable={t("dashboard.unavailable")} symbol="▦" heading={t("dashboard.events")} description={t("dashboard.eventsDesc")}/>
              </div>
            </div>
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

          <footer className="smn-dashboard-footer">
            <span>{t("dashboard.footer")}</span>
            <span>{t("dashboard.footerHint")}</span>
          </footer>

  </>;
}
