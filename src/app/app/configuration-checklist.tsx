"use client";
import Link from "next/link";
import {useState} from "react";
import {useTranslation} from "@/i18n/client";
import type {TranslationKey} from "@/i18n/catalog";
import type {ConfigurationChecklist,ConfigurationTaskKey,ConfigurationStatus} from "@/server/configuration/tasks";

const definitions:Record<ConfigurationTaskKey,{
  href:string;title:TranslationKey;description:TranslationKey;
}>={
  "reference-country":{href:"/app/admin/settings",title:"configuration.tasks.referenceCountry.title",
    description:"configuration.tasks.referenceCountry.description"},
  "recovery-phrase":{href:"/app/security",title:"configuration.tasks.recoveryPhrase.title",
    description:"configuration.tasks.recoveryPhrase.description"},
  "display-preferences":{href:"/app/admin/settings",title:"configuration.tasks.displayPreferences.title",
    description:"configuration.tasks.displayPreferences.description"},
};
const statusKeys:Record<ConfigurationStatus,TranslationKey>={
  todo:"configuration.status.todo",done:"configuration.status.done",ignored:"configuration.status.ignored",
};

export default function ConfigurationChecklist({initial}:{initial:ConfigurationChecklist}) {
  const t=useTranslation();
  const [value,setValue]=useState(initial);
  const [pending,setPending]=useState<string|null>(null);
  const [error,setError]=useState(false);
  const count=(status:ConfigurationStatus)=>value.tasks.filter(task=>task.status===status).length;
  async function change(key:ConfigurationTaskKey,status:ConfigurationStatus) {
    if (pending!==null)return;
    setPending(key);setError(false);
    try {
      const response=await fetch("/api/admin/configuration-tasks",{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({key,status}),cache:"no-store",
      });
      if (!response.ok)throw new Error("save");
      const checklist=await response.json() as ConfigurationChecklist;
      if (!Array.isArray(checklist.tasks))throw new Error("invalid-response");
      setValue(checklist);
    }catch {setError(true);}
    finally {setPending(null);}
  }
  return <section className="mt-4" id="configuration" aria-labelledby="configuration-heading">
    <div className="smn-section-title">
      <div>
        <div className="smn-eyebrow">{t("configuration.eyebrow")}</div>
        <h2 className="h5 fw-bold mb-0" id="configuration-heading">{t("configuration.title")}</h2>
      </div>
      <span className="smn-section-meta">
        {count("todo")} {t("configuration.todoCount")} · {count("done")} {t("configuration.doneCount")} · {count("ignored")} {t("configuration.ignoredCount")}
      </span>
    </div>
    <p className="small text-secondary">{t("configuration.intro")}</p>
    {error&&<div role="alert" className="alert alert-warning">{t("configuration.error")}</div>}
    <div className="row g-3">
      {value.tasks.map(task=><div key={task.key} className="col-12 col-xl-4">
        <article className="smn-dashboard-card h-100 d-flex flex-column gap-3">
          <div className="d-flex align-items-start justify-content-between gap-2">
            <h3 className="h6 fw-bold mb-0">{t(definitions[task.key].title)}</h3>
            <span className="smn-not-available">{t(statusKeys[task.status])}</span>
          </div>
          <p className="small text-secondary mb-0">{t(definitions[task.key].description)}</p>
          <div className="mt-auto d-grid gap-2">
            <Link className="btn btn-outline-primary btn-sm" href={definitions[task.key].href}>
              {t("configuration.open")}
            </Link>
            <label className="form-label small mb-0" htmlFor={"configuration-"+task.key}>
              {t("configuration.fieldLabel")}
            </label>
            <select className="form-select form-select-sm" id={"configuration-"+task.key}
              disabled={pending!==null} value={task.status}
              onChange={e=>void change(task.key,e.target.value as ConfigurationStatus)}>
              <option value="todo">{t("configuration.status.todo")}</option>
              <option value="done">{t("configuration.status.done")}</option>
              <option value="ignored">{t("configuration.status.ignored")}</option>
            </select>
          </div>
        </article>
      </div>)}
    </div>
    {pending&&<p role="status" className="small text-secondary mt-2">{t("configuration.saving")}</p>}
  </section>;
}
