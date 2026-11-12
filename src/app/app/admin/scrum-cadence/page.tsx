import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import CadenceForm from "./cadence-form";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import SettingsPageShell from "../settings/settings-page-shell";
export const dynamic="force-dynamic";
export default async function ScrumCadencePage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 if(account.must_change_password)redirect("/change-password");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"scrumCadence.title")} description={translate(locale,"scrumCadence.intro")} eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
  <CadenceForm/>
  
 </SettingsPageShell>;
}
