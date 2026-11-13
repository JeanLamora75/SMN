import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import TeamsSettings from "./teams-settings";
import TeamCreateButton from "./team-create-button";
import SettingsPageShell from "../settings-page-shell";

export const dynamic="force-dynamic";

/** Cette page demeure en lecture seule jusqu'à l'activation contrôlée v28. */
export default async function TeamsSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))
  redirect("/app");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"teamSettings.title")}
  description={translate(locale,"teamSettings.intro")}
  eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}
  action={<TeamCreateButton/>}>
  <TeamsSettings/>
 </SettingsPageShell>;
}
