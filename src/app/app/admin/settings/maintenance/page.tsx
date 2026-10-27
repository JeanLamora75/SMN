import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate,type TranslationKey} from "@/i18n/catalog";
import {withAuthDb} from "@/server/auth/database";
import {readAuditJournal} from "@/server/audit/journal";
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
 const t=(key:TranslationKey)=>translate(locale,key);
 const entries=audit?await withAuthDb(client=>readAuditJournal(client)).catch(()=>null):null;

 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">
  <Link href="/app/admin/settings" className="btn btn-link px-0 mb-2">← {translate(locale,"navigation.entries.settings")}</Link>
  <header className="mb-3"><h1 className="h3">{translate(locale,"settingsCatalog.items.maintenance.title")}</h1>
   <p className="text-secondary">{translate(locale,"settingsCatalog.items.maintenance.description")}</p></header>
  <SettingsTabs label={translate(locale,"settingsCatalog.items.maintenance.title")} sections={[
   ...(backups?[{id:"backups",label:translate(locale,"settingsCatalog.items.backups.title"),content:<BackupsAdmin/>}]:[]),
   ...(audit?[{id:"audit",label:translate(locale,"settingsCatalog.items.audit.title"),content:<section className="smn-panel rounded-4 p-3">{entries===null?<p role="alert" className="alert alert-warning">{t("audit.unavailable")}</p>:entries.length===0?<p role="status" className="alert alert-info">{t("audit.empty")}</p>:<ol className="list-unstyled d-grid gap-2">{entries.map(entry=><li className="border rounded p-3" key={entry.id}><div className="d-flex flex-wrap justify-content-between gap-2"><strong>{t(`audit.actions.${entry.action}` as TranslationKey)}</strong><time dateTime={entry.occurredAt} className="small text-secondary">{new Date(entry.occurredAt).toLocaleString(locale==="en"?"en-GB":"fr-FR",{timeZone:"UTC"})} UTC</time></div><p className="small mb-1">{t("audit.actor")}: {entry.actorId??t("audit.unknownActor")}</p><p className="small mb-0">{t("audit.object")}: {t(`audit.types.${entry.objectType}` as TranslationKey)}</p></li>)}</ol>}</section>}]:[])
  ]}/>
 </main>;
}
