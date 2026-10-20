import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import { canAccess } from "@/server/access-policy";
import SessionActivity from "../../session-activity";
import SettingsForm from "./settings-form";
export const dynamic="force-dynamic";
export default async function GeneralSettingsPage() {
  const account=await currentAccount();
  if(!account) redirect("/login");
  if(account.must_change_password) redirect("/change-password");
  if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true})) redirect("/app");
  return <main className="smn-page container py-5" style={{maxWidth:900}}>
    <header className="mb-4">
      <h1 className="h3">Paramètres généraux</h1>
      <p>Personnaliser l'installation sans modifier son produit, son mode Agile ou les historiques enregistrés.</p>
      <Link href="/app" className="btn btn-outline-secondary">Retour au tableau de bord</Link>
    </header>
    <SettingsForm/>
    <SessionActivity/>
  </main>;
}
