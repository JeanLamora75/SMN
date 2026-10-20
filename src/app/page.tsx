import Link from "next/link";
import { browserLanguage, translations } from "@/lib/messages";
import { currentInstallationDiagnostic } from "@/server/installation/current";
import { canVisitSetup } from "@/server/access-policy";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [diagnostic, lang] = await Promise.all([
    currentInstallationDiagnostic(),
    browserLanguage(),
  ]);
  const en = lang === "en";
  const status = translations[lang][diagnostic.status];

  return (
    <main className="smn-page container py-5">
      <header className="d-flex align-items-center gap-3 mb-5">
        <span className="smn-mark">SMN</span>
        <div>
          <h1 className="h3 mb-1">Scrum Master Notebook</h1>
          <p className="smn-subtitle mb-0">{en ? "Local startup & requirements" : "Démarrage local et prérequis"}</p>
        </div>
      </header>
      <section className="smn-panel p-4 p-md-5" aria-labelledby="diagnostic-heading">
        <h2 id="diagnostic-heading" className="h4 mb-3">{en ? "Installation diagnostics" : "Diagnostic de l'installation"}</h2>
        <p role="status" className="lead">{status}</p>
        <p className="smn-subtitle">
          {en
            ? "No database or account is created when the server starts. Private routes are blocked until secure login is implemented."
            : "Le démarrage ne crée aucune base ni aucun compte. Les pages privées restent protégées jusqu'à la livraison de l'authentification."}
        </p>
        <div className="d-flex flex-wrap gap-2 mt-4">
          <Link className="btn btn-outline-primary" href="/">{en ? "Retry diagnostics" : "Relancer le diagnostic"}</Link>
          {canVisitSetup(diagnostic) && (
            <Link className="btn btn-primary" href="/setup">
              {en ? "Prepare installation" : "Préparer l'installation"}
            </Link>
          )}
        </div>
      </section>
      <p className="small smn-subtitle mt-4">{en ? "I0 / SMN-11 — prerequisite checks only" : "I0 / SMN-11 — contrôle des prérequis uniquement"}</p>
    </main>
  );
}
