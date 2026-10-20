import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { canVisitPrivate } from "@/server/access-policy";
import LogoutControl from "./logout-control";
import Link from "next/link";
import SessionActivity from "./session-activity";
export const dynamic = "force-dynamic";
export default async function PrivatePage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (!canVisitPrivate({ role: account.role, mustChangePassword: account.must_change_password }))
    redirect("/change-password");
  return <main className="smn-page container py-5">
    <header className="d-flex align-items-center gap-3 mb-4">
      <span className="smn-mark">SMN</span>
      <div><h1 className="h3 mb-1">Scrum Master Notebook</h1>
        <p className="smn-subtitle mb-0">Espace privé — session authentifiée</p></div>
    </header>
    <section className="smn-panel p-4 p-md-5">
      <h2 className="h4">Bienvenue {account.username}</h2>
      <p>Votre compte est connecté avec le profil <strong>{account.role === "admin" ? "Administrateur" : "Utilisateur"}</strong>.</p>
      <p>Votre installation est prête. Les futures pages Scrum et Kanban seront ajoutées progressivement au MVP.</p>
      <p className="small text-secondary">Votre session expire après 30 minutes d’inactivité ou 8 heures au maximum,
        même si vous restez actif. Aucune connexion persistante n’est créée.</p>
      {account.role === "admin" && <p><Link className="btn btn-primary" href="/app/admin/users">Administrer les comptes utilisateurs</Link></p>}
      <LogoutControl/>
    </section>
    <SessionActivity/>
  </main>;
}
