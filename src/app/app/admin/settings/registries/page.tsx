import SettingsTabs from "../settings-tabs";
import Link from "next/link";
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
 return <main className="smn-page container-fluid px-3 px-lg-4 py-4">
  <Link href="/app/admin/settings">← {translate(locale,"navigation.entries.settings")}</Link>
  <header className="my-3"><h1 className="h3">{translate(locale,"settingsCatalog.items.registries.title")}</h1>
   <p className="text-secondary">{translate(locale,"settingsCatalog.items.registries.description")}</p></header>
  <SettingsTabs label={translate(locale,"settingsCatalog.items.registries.title")} sections={[
   {id:"categories",label:translate(locale,"settingsCatalog.tabs.categories"),content:<AutomaticHighlightsSettings canManage={actor.role==="admin"}/>},
   {id:"alerts",label:translate(locale,"settingsCatalog.tabs.alerts"),content:<RegistryDeadlineAlerts canManage={actor.role==="admin"}/>}
  ]}/>
 </main>;
}
