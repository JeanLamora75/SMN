import Link from "next/link";
import { redirect } from "next/navigation";
import { currentInstallationDiagnostic } from "@/server/installation/current";
import { currentAccount } from "@/server/auth/session";
import LoginForm from "./login-form";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  const diagnostic = await currentInstallationDiagnostic();
  if (diagnostic.status !== "initialized") redirect("/");
  const account = await currentAccount();
  if (account) redirect(account.must_change_password ? "/change-password" : "/app");
  return <main className="smn-page container py-5">
    <section className="smn-panel p-4 p-md-5 mx-auto" style={{maxWidth:590}}>
      <h1 className="h3 mb-3">Se connecter à Scrum Master Notebook</h1>
      <p className="smn-subtitle">Utilisez le nom d’utilisateur ou l’adresse e-mail définis lors de l’installation.</p>
      <LoginForm/>
      <Link href="/" className="btn btn-link mt-3">Retour à l’accueil</Link>
    </section>
  </main>;
}
