import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { canAccess } from "@/server/access-policy";
import SessionActivity from "../../session-activity";
import UsersAdmin from "./users-admin";

export const dynamic = "force-dynamic";
export default async function UsersPage() {
  const account=await currentAccount();
  if (!account) redirect("/login");
  if (account.must_change_password) redirect("/change-password");
  if (!canAccess(account,"read",{type:"accounts",exists:true,inScope:true})) redirect("/app");
  return <main className="smn-page container py-5">
    <header className="mb-4">
      <h1 className="h3">Administration des utilisateurs</h1>
      <p>Créer, consulter, activer ou désactiver les comptes de Scrum Master Notebook.</p>
      <Link href="/app" className="btn btn-outline-secondary">Retour à l’espace privé</Link>
    </header>
    <UsersAdmin selfId={account.id}/>
    <SessionActivity/>
  </main>;
}
