import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {canAccess} from "@/server/access-policy";
import CompaniesAdmin from "./companies-admin";
import SettingsPageShell from "../settings/settings-page-shell";
export const dynamic="force-dynamic";
export default async function CompaniesPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"write",{type:"companies",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"settingsCatalog.items.companies.title")} description={translate(locale,"settingsCatalog.navigation.companiesIntro")} eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
  <CompaniesAdmin/>
 </SettingsPageShell>;
}