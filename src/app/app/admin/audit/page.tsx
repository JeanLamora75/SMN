import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readAuditJournal} from "@/server/audit/journal";
import {requestLocale} from "@/i18n/locale.server";
import {translate,type TranslationKey} from "@/i18n/catalog";
export const dynamic="force-dynamic";
export default async function AuditPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"audit",exists:true,inScope:true}))notFound();
 const locale=await requestLocale();
 const t=(key:TranslationKey)=>translate(locale,key);
 const entries=await withAuthDb(client=>readAuditJournal(client)).catch(()=>null);
 return <div className="smn-page container py-5">
  <header className="mb-4">
   <h1 className="h3">{t("audit.title")}</h1>
   <p>{t("audit.intro")}</p>
   <Link href="/app" className="btn btn-outline-secondary">{t("audit.back")}</Link>
  </header>
  {!entries?<p role="alert" className="alert alert-warning">{t("audit.unavailable")}</p>:
   entries.length===0?<p role="status" className="alert alert-info">{t("audit.empty")}</p>:
   <ol className="list-unstyled d-grid gap-3" aria-label={t("audit.title")}>
    {entries.map(entry=><li key={entry.id} className="smn-panel p-3">
     <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
      <strong>{t(`audit.actions.${entry.action}` as TranslationKey)}</strong>
      <time dateTime={entry.occurredAt} className="text-secondary small">
       {new Date(entry.occurredAt).toLocaleString(locale==="en"?"en-GB":"fr-FR",{timeZone:"UTC",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"})} UTC
      </time>
     </div>
     <p className="small mb-2">{t("audit.success")} · {t("audit.actor")}: <code>{entry.actorId??t("audit.unknownActor")}</code></p>
     <p className="small mb-2">{t("audit.object")}: {t(`audit.types.${entry.objectType}` as TranslationKey)}
       {" · "}<code>{entry.objectId}</code> · {t("audit.scope")}: {entry.scope}</p>
     {Object.keys(entry.changes.after).length>0&&<dl className="small mb-2">
      {Object.entries(entry.changes.after).filter(([key,value])=>
       entry.changes.before[key]!==value).map(([key,value])=>
       <div key={key} className="d-flex flex-wrap gap-2">
        <dt>{t(`audit.fields.${key}` as TranslationKey)}:</dt>
        <dd className="mb-0">{String(entry.changes.before[key]??"—")} → {String(value)}</dd>
       </div>)}
     </dl>}
     <p className="text-secondary small mb-0">{t("audit.operationId")}: <code>{entry.id}</code></p>
    </li>)}
   </ol>}
 </div>;
}
