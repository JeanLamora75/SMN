import Link from "next/link";
import { notFound } from "next/navigation";
import { currentInstallationDiagnostic } from "@/server/installation/current";
import SetupWelcome from "./welcome-form";
export const dynamic = "force-dynamic";
export default async function WelcomePage() {
  const state = await currentInstallationDiagnostic();
  if (state.status === "initialized") notFound();
  return <main className="smn-page container py-5"><section className="smn-panel p-4 p-md-5">
    <h1 className="h3">Installer Scrum Master Notebook</h1>
    <p className="smn-subtitle">Scrum Master Notebook va procéder à son installation, veuillez renseigner les informations ci-dessous.</p>
    <SetupWelcome/>
    <Link className="btn btn-link mt-3" href="/">Retour à l’accueil</Link>
  </section></main>;
}
