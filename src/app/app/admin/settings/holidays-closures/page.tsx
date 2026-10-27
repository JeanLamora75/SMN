import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import CountryAdmin from "../../countries/country-admin";
import CompanyClosuresAdmin from "../../company-closures/company-closures-admin";
import SettingsTabs from "../settings-tabs";

export const dynamic="force-dynamic";
export default async function HolidaysClosuresSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const fr=locale==="fr";
 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">
  <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {translate(locale,"navigation.entries.settings")}</Link>
  <header className="mb-3"><h1 className="h3">{translate(locale,"settingsCatalog.items.holidaysClosures.title")}</h1>
   <p className="text-secondary">{translate(locale,"settingsCatalog.items.holidaysClosures.description")}</p></header>
  <SettingsTabs label={translate(locale,"settingsCatalog.items.holidaysClosures.title")} sections={[
   {id:"holidays",label:translate(locale,"settingsCatalog.items.countries.title"),
    content:<CountryAdmin canManage={canAccess(account,"write",{type:"settings",exists:true,inScope:true})}/>},
   ...(canAccess(account,"write",{type:"settings",exists:true,inScope:true})?
    [{id:"closures",label:translate(locale,"settingsCatalog.items.closures.title"),content:<CompanyClosuresAdmin/>}]:[])
  ]}/>
 </main>;
}
