import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import LoginForm from "./login-form";
export const dynamic="force-dynamic";
export default async function LoginPage(){
  const account=await currentAccount();
  if(account)redirect(account.must_change_password?"/change-password":"/app");
  const locale=await requestLocale();
  const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
  return <main id="smn-main" className="smn-page container py-5">
    <section className="smn-panel p-4 p-md-5 mx-auto" style={{maxWidth:590}}>
      <h1 className="h3 mb-3">{t("login.title")}</h1>
      <p className="smn-subtitle">{t("login.intro")}</p>
      <LoginForm/>
      <Link href="/" className="btn btn-link mt-3">{t("login.back")}</Link>
    </section>
  </main>;
}
