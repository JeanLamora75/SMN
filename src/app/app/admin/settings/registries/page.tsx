import SettingsTabs from "../settings-tabs";
import SettingsPageShell from "../settings-page-shell";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import AutomaticHighlightsSettings from "@/app/app/admin/registries/automatic-highlights-settings";
import RegistryDeadlineAlerts from "@/app/app/admin/registries/registry-deadlines";
export const dynamic="force-dynamic";
export default async function RegistrySettingsPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"settingsCatalog.items.registries.title")}
  description={translate(locale,"settingsCatalog.items.registries.description")}
  eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
  <SettingsTabs label={translate(locale,"settingsCatalog.items.registries.title")} sections={[
   {id:"categories",label:translate(locale,"settingsCatalog.tabs.categories"),content:<AutomaticHighlightsSettings canManage={actor.role==="admin"}/>},
   {id:"alerts",label:translate(locale,"settingsCatalog.tabs.alerts"),content:<RegistryDeadlineAlerts canManage={actor.role==="admin"}/>}
  ]}/>
 </SettingsPageShell>;
}
