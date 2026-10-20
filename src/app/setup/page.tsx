import Link from "next/link";
import { notFound } from "next/navigation";
import { currentInstallationDiagnostic } from "@/server/installation/current";
import { canVisitSetup } from "@/server/access-policy";
import SetupForm from "./setup-form";
export const dynamic = "force-dynamic";
export default async function SetupPage() {
  const diagnostic = await currentInstallationDiagnostic();
  if (!canVisitSetup(diagnostic)) notFound();
  return <main className="smn-page container py-5"><section className="smn-panel p-4 p-md-5">
    <h1 className="h3">Installer Scrum Master Notebook</h1>
    <p className="smn-subtitle">Installation Express — Scrum ou Kanban, un produit, une équipe et un Administrateur.</p>
    <p>État de la base : <strong>{diagnostic.status === "database-missing" ? "base SMN à créer" : "base SMN vierge"}</strong>.</p>
    <p className="small text-secondary">La confirmation autorise uniquement la création de la base dédiée configurée et les tables initiales. Aucune autre base n'est modifiée. Aucune session ni tableau de bord n'est ouvert avant SMN-14.</p>
    <SetupForm/><Link href="/" className="btn btn-link mt-3">Retour au diagnostic</Link>
  </section></main>;
}
