import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import SettingsPageShell from "../settings-page-shell";
import AiConnectionsSettings from "./ai-connections-settings";
export const dynamic="force-dynamic";
export default async function AiSettingsPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(actor.role!=="admin")redirect("/app/admin/settings");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"aiConnections.title")}
  description={translate(locale,"aiConnections.description")}
  eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
   <AiConnectionsSettings/>
 </SettingsPageShell>;
}
