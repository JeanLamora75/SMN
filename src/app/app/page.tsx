import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { withAuthDb } from "@/server/auth/database";
import { canAccess } from "@/server/access-policy";
import { readCollectiveDashboard } from "@/server/dashboard/read";
import LogoutControl from "./logout-control";
import SessionActivity from "./session-activity";
import ConfigurationChecklist from "./configuration-checklist";
import { readConfigurationChecklist } from "@/server/configuration/tasks";

export const dynamic = "force-dynamic";

const nav = [
  { anchor: "#pilotage", title: "Vue d'ensemble", glyph: "◫" },
  { anchor: "#cycles", title: "Cycles et bilans", glyph: "◷" },
  { anchor: "#calendrier", title: "Calendrier Agile", glyph: "▦" },
  { anchor: "#registres", title: "Points d'attention", glyph: "◇" },
  { anchor: "#reportings", title: "Reportings et briefs", glyph: "▤" },
] as const;

function EmptyBlock({ heading, description, symbol }: Readonly<{
  heading: string; description: string; symbol: string;
}>) {
  return <article className="smn-dashboard-card h-100">
    <div className="d-flex justify-content-between align-items-start gap-3">
      <span className="smn-card-icon" aria-hidden="true">{symbol}</span>
      <span className="smn-not-available">Non renseigné</span>
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

  let dashboard: Awaited<ReturnType<typeof readCollectiveDashboard>>;
  try {
    dashboard = await withAuthDb(readCollectiveDashboard);
  } catch {
    return <main className="container py-5">
      <section className="smn-panel p-4" role="alert">
        <h1 className="h4">Le tableau de bord est temporairement indisponible</h1>
        <p>SMN n&apos;a pas pu retrouver le contexte produit et équipe. Aucune donnée n&apos;a été modifiée.</p>
        <Link className="btn btn-outline-primary" href="/app">Réessayer</Link>
        <div className="mt-3"><LogoutControl/></div>
      </section>
    </main>;
  }

  const canManageConfiguration=canAccess(account,"read",{type:"settings",exists:true,inScope:true});
  const configuration=canManageConfiguration
    ? await withAuthDb(readConfigurationChecklist).catch(()=>null) : null;
  const { context } = dashboard;
  const scrum = context.mode === "scrum";
  const cycleName = scrum ? "Sprint" : "Période Kanban";

  return <div className="smn-dashboard">
    <header className="smn-dashboard-topbar">
      <div className="container-fluid smn-dashboard-width d-flex align-items-center justify-content-between gap-3">
        <Link href="/app" className="smn-brand" aria-label="Retour au tableau de bord">
          <span className="smn-mark" aria-hidden="true">SMN</span>
          <span className="smn-brand-name">Scrum Master <strong>Notebook</strong></span>
        </Link>
        <div className="d-flex align-items-center gap-3">
          <span className="smn-account-pill"><span className="smn-account-dot" aria-hidden="true"/>
            <span className="d-none d-sm-inline">{account.username}</span>
            <span className="visually-hidden">Compte connecté : {account.username}</span>
          </span>
          <LogoutControl/>
        </div>
      </div>
    </header>

    <div className="container-fluid smn-dashboard-width">
      <div className="row g-4 smn-dashboard-columns">
        <aside className="col-12 col-lg-3 col-xl-2" aria-label="Navigation principale">
          <nav className="smn-dashboard-nav">
            <div className="smn-nav-eyebrow">ESPACE DE TRAVAIL</div>
            <Link href="/app" className="smn-nav-link is-active" aria-current="page">
              <span aria-hidden="true">▦</span> Tableau de bord
            </Link>
            <Link className="smn-nav-link" href="/app/security"><span aria-hidden="true">♧</span> Sécurité du compte</Link>
            <div className="smn-nav-eyebrow mt-4">RUBRIQUES</div>
            {nav.map(link=><a key={link.anchor} href={link.anchor} className="smn-nav-link">
              <span aria-hidden="true">{link.glyph}</span>{link.title}
            </a>)}
            {canAccess(account,"read",{type:"accounts",exists:true,inScope:true})&&<>
              <div className="smn-nav-eyebrow mt-4">ADMINISTRATION</div>
              <Link className="smn-nav-link" href="/app/admin/users"><span aria-hidden="true">⚙</span>Comptes utilisateurs</Link>
              <Link className="smn-nav-link" href="/app/admin/settings"><span aria-hidden="true">⚙</span>Paramètres généraux</Link>
              <a className="smn-nav-link" href="#configuration"><span aria-hidden="true">☑</span>Configuration</a>
            </>}
            <div className="smn-nav-help mt-4">
              <span className="fw-semibold">Une interface qui grandit avec vous</span>
              <p className="small mb-0 mt-2">Les fonctions se complètent progressivement. Aucune donnée fictive n&apos;est affichée.</p>
            </div>
          </nav>
        </aside>

        <main className="col-12 col-lg-9 col-xl-10 pb-5">
          <div id="pilotage" className="smn-dashboard-heading">
            <div>
              <div className="smn-eyebrow">PILOTAGE <span className="smn-heading-separator">/</span> TABLEAU DE BORD</div>
              <h1 className="smn-dashboard-title">Vue d&apos;ensemble</h1>
              <p className="text-secondary mb-0">Toutes les informations utiles à votre équipe, au même endroit.</p>
            </div>
            <span className="smn-pilot-label">Mode {scrum?"Scrum":"Kanban"}</span>
          </div>

          <section className="smn-context-card" aria-labelledby="context-heading">
            <div className="smn-context-main">
              <div className="smn-context-overline">VOTRE ESPACE DE PILOTAGE</div>
              <h2 id="context-heading">{context.product}</h2>
              <p className="mb-0 smn-context-team">
                <span className="smn-context-circle" aria-hidden="true">◉</span> Équipe {context.team}
              </p>
            </div>
            <div className="smn-context-meta">
              <div className="smn-context-label">Cadre de travail</div>
              <div className="fw-semibold">{scrum?"Scrum":"Kanban"}</div>
              <div className="smn-context-label mt-3">Cycle actuel</div>
              <div className="fw-semibold">Non renseigné</div>
            </div>
          </section>

          {configuration&&<ConfigurationChecklist initial={configuration}/>}

          <section className="mt-4" id="cycles" aria-labelledby="cycle-heading">
            <div className="smn-section-title">
              <div>
                <div className="smn-eyebrow">01 · CADENCE</div>
                <h2 className="h5 fw-bold mb-0" id="cycle-heading">Cycles et bilans</h2>
              </div>
              <span className="smn-section-meta">Équipe : {context.team}</span>
            </div>
            <div className="smn-dashboard-card smn-cycle-empty">
              <div className="smn-cycle-symbol" aria-hidden="true">◷</div>
              <div className="flex-grow-1">
                <h3 className="h6 fw-bold mb-2">Aucun {cycleName.toLowerCase()} enregistré pour le moment</h3>
                <p className="text-secondary mb-2">Votre installation est prête. Le premier cycle pourra être créé à la demande lorsque la gestion des {scrum?"Sprints":"périodes Kanban"} sera disponible.</p>
                <span className="smn-inline-note">Aucun cycle n&apos;est généré automatiquement.</span>
              </div>
              <span className="smn-coming-soon" title="La création de cycles sera livrée dans une prochaine User Story">
                Création bientôt disponible
              </span>
            </div>
            <div className="smn-pending-cycle mt-3">
              <span className="fw-semibold">Bilans en attente</span>
              <span className="text-secondary">Aucun cycle enregistré — aucun bilan en attente identifiable.</span>
            </div>
          </section>

          <section className="mt-5" aria-labelledby="summary-heading">
            <div className="smn-section-title">
              <div>
                <div className="smn-eyebrow">02 · SUIVI COLLECTIF</div>
                <h2 className="h5 fw-bold mb-0" id="summary-heading">L&apos;essentiel de votre équipe</h2>
              </div>
              <span className="smn-section-meta">Données réelles uniquement</span>
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-6 col-xl-4">
                <EmptyBlock symbol="◎" heading="Objectifs" description="Les objectifs de cycle apparaîtront ici dès qu'ils seront enregistrés."/>
              </div>
              <div className="col-12 col-md-6 col-xl-4">
                <EmptyBlock symbol="▥" heading="Indicateurs" description="Les métriques disponibles seront présentées avec leurs sources, sans valeur à zéro par défaut."/>
              </div>
              <div className="col-12 col-md-6 col-xl-4" id="calendrier">
                <EmptyBlock symbol="▦" heading="Événements Agile" description="Les prochaines cérémonies et réunions apparaîtront lorsqu'elles auront été planifiées."/>
              </div>
            </div>
          </section>

          <div className="row g-4 mt-2">
            <section className="col-12 col-xl-7" id="registres" aria-labelledby="attention-heading">
              <div className="smn-section-title">
                <div>
                  <div className="smn-eyebrow">03 · VISIBILITÉ</div>
                  <h2 className="h5 fw-bold mb-0" id="attention-heading">Points d&apos;attention</h2>
                </div>
              </div>
              <div className="smn-dashboard-card smn-attention-card">
                <div className="smn-card-icon mb-3" aria-hidden="true">◇</div>
                <h3 className="h6 fw-bold">Aucun point d&apos;attention disponible</h3>
                <p className="small text-secondary mb-3">Les risques, obstacles et dépendances enregistrés seront visibles ici. Les alertes resteront informatives et ne modifieront aucun statut.</p>
                <span className="smn-inline-note">Aucune alerte fictive.</span>
              </div>
            </section>
            <section className="col-12 col-xl-5" id="reportings" aria-labelledby="reporting-heading">
              <div className="smn-section-title">
                <div>
                  <div className="smn-eyebrow">04 · PARTAGE</div>
                  <h2 className="h5 fw-bold mb-0" id="reporting-heading">Reportings et briefs</h2>
                </div>
              </div>
              <div className="smn-dashboard-card smn-attention-card">
                <div className="smn-card-icon mb-3" aria-hidden="true">▤</div>
                <h3 className="h6 fw-bold">Aucun rapport disponible</h3>
                <p className="small text-secondary mb-3">Vous retrouverez ici les bilans et reportings créés à partir de données collectives enregistrées.</p>
                <span className="smn-inline-note">Module à venir</span>
              </div>
            </section>
          </div>

          <footer className="smn-dashboard-footer">
            <span>Scrum Master Notebook · Pilote MVP</span>
            <span>Les champs non disponibles ne sont pas interprétés comme des résultats nuls.</span>
          </footer>
        </main>
      </div>
    </div>
    <SessionActivity/>
  </div>;
}
