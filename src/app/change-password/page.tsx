import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/session";
import PasswordChangeForm from "./password-form";
import SessionActivity from "../app/session-activity";
export const dynamic = "force-dynamic";
export default async function ChangePasswordPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  if (!account.must_change_password) redirect("/app");
  return <main className="smn-page container py-5">
    <section className="smn-panel p-4 p-md-5 mx-auto" style={{maxWidth:640}}>
      <h1 className="h3">Modifier votre mot de passe initial</h1>
      <p>Bienvenue <strong>{account.username}</strong>. Avant d’accéder à l’application,
        vous devez remplacer le mot de passe défini lors de l’installation.</p>
      <p className="small text-secondary">Le pilote accepte un nouveau mot de passe à partir de 4 caractères ;
        choisissez-en un différent du précédent et suffisamment difficile à deviner.</p>
      <PasswordChangeForm/>
      <SessionActivity/>
    </section>
  </main>;
}
