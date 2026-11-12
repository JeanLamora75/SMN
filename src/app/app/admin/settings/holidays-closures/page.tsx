import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import CountryAdmin from "../../countries/country-admin";
import CompanyClosuresAdmin from "../../company-closures/company-closures-admin";
import SettingsTabs from "../settings-tabs";
import SettingsPageShell from "../settings-page-shell";

export const dynamic="force-dynamic";
export default async function HolidaysClosuresSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"settingsCatalog.items.holidaysClosures.title")} description={translate(locale,"settingsCatalog.items.holidaysClosures.description")} eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
  <SettingsTabs label={translate(locale,"settingsCatalog.items.holidaysClosures.title")} sections={[
   {id:"holidays",label:translate(locale,"settingsCatalog.items.countries.title"),
    content:<CountryAdmin canManage={canAccess(account,"write",{type:"settings",exists:true,inScope:true})}/>},
   ...(canAccess(account,"write",{type:"settings",exists:true,inScope:true})?
    [{id:"closures",label:translate(locale,"settingsCatalog.items.closures.title"),content:<CompanyClosuresAdmin/>}]:[])
  ]}/>
 </SettingsPageShell>;
}
