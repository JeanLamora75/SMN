import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import BackupsAdmin from "../../backups/backups-admin";
import SettingsTabs from "../settings-tabs";

export const dynamic="force-dynamic";
export default async function MaintenanceSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 const backups=canAccess(account,"read",{type:"backups",exists:true,inScope:true});
 const audit=canAccess(account,"read",{type:"audit",exists:true,inScope:true});
 if(!backups&&!audit)notFound();
 const locale=await requestLocale();

 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">
  <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {translate(locale,"navigation.entries.settings")}</Link>
  <header className="mb-3"><h1 className="h3">{translate(locale,"settingsCatalog.items.maintenance.title")}</h1>
   <p className="text-secondary">{translate(locale,"settingsCatalog.items.maintenance.description")}</p></header>
  <SettingsTabs label={translate(locale,"settingsCatalog.items.maintenance.title")} sections={[
   ...(backups?[{id:"backups",label:translate(locale,"settingsCatalog.items.backups.title"),content:<BackupsAdmin/>}]:[]),
   ...(audit?[{id:"audit",label:translate(locale,"settingsCatalog.items.audit.title"),content:<Link className="btn btn-outline-primary" href="/app/admin/audit">{translate(locale,"settingsCatalog.items.audit.title")}</Link>}]:[])
  ]}/>
 </main>;
}
