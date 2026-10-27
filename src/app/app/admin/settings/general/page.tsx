import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import SettingsForm from "../settings-form";
export const dynamic="force-dynamic";
export default async function GeneralSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 return <main className="smn-page container-fluid px-3 px-lg-4 py-4">
  <header className="mb-3">
   <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {t("navigation.entries.settings")}</Link>
   <h1 className="h3">{t("settings.title")}</h1>
   <p>{t("settings.intro")}</p>
  </header>
  <SettingsForm/>
 </main>;
}
