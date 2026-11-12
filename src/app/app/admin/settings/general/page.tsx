import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import SettingsForm from "../settings-form";
import SettingsPageShell from "../settings-page-shell";
export const dynamic="force-dynamic";
export default async function GeneralSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 return <SettingsPageShell title={t("settings.title")} description={t("settings.intro")}
  eyebrow={t("settingsCatalog.navigation.adminEyebrow")} constrained>
  <SettingsForm/>
 </SettingsPageShell>;
}
