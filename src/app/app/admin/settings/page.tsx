import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import SettingsForm from "./settings-form";
export const dynamic="force-dynamic";
export default async function GeneralSettingsPage(){
  const account=await currentAccount();
  if(!account)redirect("/login");
  if(account.must_change_password)redirect("/change-password");
  if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
  const locale=await requestLocale();
  const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
  return <div className="smn-page container py-5" style={{maxWidth:900}}>
    <header className="mb-4">
      <h1 className="h3">{t("settings.title")}</h1>
      <p>{t("settings.intro")}</p>
      <Link href="/app" className="btn btn-outline-secondary">{t("settings.back")}</Link>
    </header>
    <SettingsForm/>
  </div>;
}
