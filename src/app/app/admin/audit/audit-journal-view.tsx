import {translate,type TranslationKey} from "@/i18n/catalog";
import type {Language} from "@/lib/language";
import type {readAuditJournal} from "@/server/audit/journal";

export default function AuditJournalView({entries,locale}:{entries:Awaited<ReturnType<typeof readAuditJournal>>|null;locale:Language}){
 const t=(key:TranslationKey)=>translate(locale,key);
 return <>
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
 </>;
}
