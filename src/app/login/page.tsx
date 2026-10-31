import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import LoginForm from "./login-form";
import "./login.css";
export const dynamic="force-dynamic";
export default async function LoginPage(){
 const account=await currentAccount();
 if(account)redirect(account.must_change_password?"/change-password":"/app");
 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 return <main id="smn-main" className="smn-login-page">
  <section className="smn-panel smn-login-card">
   <div className="smn-login-logo" aria-label="Scrum Master Notebook">
    <span className="smn-mark" aria-hidden="true">SMN</span>
    <span className="smn-brand-name">Scrum Master <strong>Notebook</strong></span>
   </div>
   <h1 className="h3 smn-login-heading">{t("login.title")}</h1>
   <LoginForm/>
  </section>
 </main>;
}
