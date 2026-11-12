import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import AuditJournalView from "../../audit/audit-journal-view";
import {withAuthDb} from "@/server/auth/database";
import {readAuditJournal} from "@/server/audit/journal";
import BackupsAdmin from "../../backups/backups-admin";
import SettingsTabs from "../settings-tabs";
import SettingsPageShell from "../settings-page-shell";
import UpdatesAdmin from "./updates-admin";

export const dynamic="force-dynamic";
export default async function MaintenanceSettingsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 const backups=canAccess(account,"read",{type:"backups",exists:true,inScope:true});
 const audit=canAccess(account,"read",{type:"audit",exists:true,inScope:true});
 const updates=account.role==="admin";
 if(!backups&&!audit&&!updates)notFound();
 const locale=await requestLocale();
 const entries=audit?await withAuthDb(client=>readAuditJournal(client)).catch(()=>null):null;

 return <SettingsPageShell title={translate(locale,"settingsCatalog.items.maintenance.title")} description={translate(locale,"settingsCatalog.items.maintenance.description")} eyebrow={translate(locale,"settingsCatalog.navigation.adminEyebrow")}>
  <SettingsTabs label={translate(locale,"settingsCatalog.items.maintenance.title")} sections={[
   ...(updates?[{id:"updates",label:translate(locale,"offlineUpdates.title"),content:<UpdatesAdmin/>}]:[]),
   ...(backups?[{id:"backups",label:translate(locale,"settingsCatalog.items.backups.title"),content:<BackupsAdmin/>}]:[]),
   ...(audit?[{id:"audit",label:translate(locale,"settingsCatalog.items.audit.title"),content:<AuditJournalView entries={entries} locale={locale}/>}]:[])
  ]}/>
 </SettingsPageShell>;
}
