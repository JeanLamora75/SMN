import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import SettingsPageShell from "../settings-page-shell";
import JiraSettingsForm from "./jira-settings-form";
export const dynamic="force-dynamic";
export default async function JiraSettingsPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.role!=="admin")redirect("/app/admin/settings");
 const locale=await requestLocale();
 return <SettingsPageShell
  title={translate(locale,"tickets.jiraSettingsTitle")}
  description={translate(locale,"tickets.jiraSettingsDescription")}
  eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
  <JiraSettingsForm/>
 </SettingsPageShell>;
}
