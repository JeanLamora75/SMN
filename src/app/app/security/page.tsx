import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import PasswordChangeForm from "@/app/change-password/password-form";
import SecurityForm from "./security-form";
import SessionActivity from "../session-activity";
export const dynamic = "force-dynamic";
export default async function SecurityPage() {
  const account=await currentAccount();
  if(!account) redirect("/login");
  if(account.must_change_password) redirect("/change-password");
  return <main className="container py-5" style={{maxWidth:740}}>
    <Link href="/app">← Retour au tableau de bord</Link>
    <h1 className="h3 mt-4">Sécurité de mon compte</h1>
    <section className="smn-panel p-4 my-4">
      <h2 className="h5">Changer mon mot de passe</h2>
      <p className="text-secondary small">Toutes les sessions antérieures seront invalidées. La session actuelle sera renouvelée.</p>
      <PasswordChangeForm initial={false}/>
    </section>
    {account.role==="admin" && <section className="smn-panel p-4">
      <h2 className="h5">Préparer une récupération locale</h2>
      <p className="text-secondary small">Définissez une phrase de secours distincte du mot de passe et de la phrase des sauvegardes. En cas d'oubli du mot de passe, la commande locale SMN permet de la consommer une seule fois. Sans préparation préalable, aucune récupération n'est possible.</p>
      <SecurityForm/>
    </section>}
    <SessionActivity/>
  </main>;
}
