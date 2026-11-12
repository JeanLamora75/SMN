import {redirect} from "next/navigation";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {currentAccount} from "@/server/auth/session";
import CategoryAdmin from "./category-admin";
import LinksAdminInventory from "./links-admin-inventory";
import SettingsPageShell from "../settings-page-shell";
import SettingsTabs from "../settings-tabs";
import "./links-admin-cockpit.css";
export const dynamic="force-dynamic";
export default async function LinksAdminPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.role!=="admin")redirect("/app");
 const locale=await requestLocale();
 return <SettingsPageShell title={translate(locale,"settingsCatalog.items.links.title")} description={translate(locale,"settingsCatalog.items.links.description")} eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
  <div className="smn-links-admin-cockpit">
   <SettingsTabs label={translate(locale,"settingsCatalog.items.links.title")} sections={[
    {id:"inventory",label:translate(locale,"linksAdmin.title"),content:<LinksAdminInventory/>},
    {id:"categories",label:translate(locale,"linksAdmin.categories"),content:<div className="smn-links-admin-panel"><CategoryAdmin/></div>}
   ]}/>
  </div>
 </SettingsPageShell>;
}
