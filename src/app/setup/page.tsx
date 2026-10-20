import Link from "next/link";
import { notFound } from "next/navigation";
import { currentInstallationDiagnostic } from "@/server/installation/current";
import { canVisitSetup } from "@/server/access-policy";
import { browserLanguage } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const diagnostic = await currentInstallationDiagnostic();
  if (!canVisitSetup(diagnostic)) notFound();
  const en = (await browserLanguage()) === "en";
  return (
    <main className="smn-page container py-5">
      <div className="smn-panel p-4">
        <h1 className="h3">{en ? "Prepare your installation" : "Préparer votre installation"}</h1>
        <p>{en ? "Your dedicated SMN database is empty." : "Votre base de données SMN dédiée est vierge."}</p>
        <p className="smn-subtitle">
          {en
            ? "The guided setup, database creation and administrator account will be implemented in SMN-12. No installation changes are made here."
            : "L'assistant, la création de la base et du compte administrateur seront livrés dans SMN-12. Cette page ne modifie rien."}
        </p>
        <Link href="/" className="btn btn-outline-primary">{en ? "Back to diagnostics" : "Retour au diagnostic"}</Link>
      </div>
    </main>
  );
}
