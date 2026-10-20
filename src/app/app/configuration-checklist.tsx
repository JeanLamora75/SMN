"use client";
import Link from "next/link";
import { useState } from "react";
import type { ConfigurationChecklist,ConfigurationStatus } from "@/server/configuration/tasks";
import fr from "@/i18n/fr.json";
import en from "@/i18n/en.json";

const destinations={
  "reference-country":"/app/admin/settings",
  "recovery-phrase":"/app/security",
  "display-preferences":"/app/admin/settings",
} as const;

export default function ConfigurationChecklist({initial}:{initial:ConfigurationChecklist}) {
  const [value,setValue]=useState(initial);
  const [pending,setPending]=useState<string|null>(null);
  const [error,setError]=useState("");
  const t=value.locale==="en"?en.configuration:fr.configuration;
  const count=(status:ConfigurationStatus)=>value.tasks.filter(task=>task.status===status).length;
  async function change(key:ConfigurationChecklist["tasks"][number]["key"],status:ConfigurationStatus) {
    if (pending!==null)return;
    setPending(key);setError("");
    try {
      const response=await fetch("/api/admin/configuration-tasks",{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({key,status}),cache:"no-store",
      });
      if (!response.ok)throw new Error("save");
      const checklist=await response.json() as ConfigurationChecklist;
      if (!Array.isArray(checklist.tasks))throw new Error("invalid-response");
      setValue(checklist);
    }catch {setError(t.error);}
    finally {setPending(null);}
  }
  return <section className="mt-4" id="configuration" aria-labelledby="configuration-heading">
    <div className="smn-section-title">
      <div>
        <div className="smn-eyebrow">CONFIGURATION</div>
        <h2 className="h5 fw-bold mb-0" id="configuration-heading">{t.title}</h2>
      </div>
      <span className="smn-section-meta">
        {count("todo")} {t.todoCount} · {count("done")} {t.doneCount} · {count("ignored")} {t.ignoredCount}
      </span>
    </div>
    <p className="small text-secondary">{t.intro}</p>
    {error&&<div role="alert" className="alert alert-warning">{error}</div>}
    <div className="row g-3">
      {value.tasks.map(task=><div key={task.key} className="col-12 col-xl-4">
        <article className="smn-dashboard-card h-100 d-flex flex-column gap-3">
          <div className="d-flex align-items-start justify-content-between gap-2">
            <h3 className="h6 fw-bold mb-0">{t.tasks[task.key].title}</h3>
            <span className="smn-not-available">{t.status[task.status]}</span>
          </div>
          <p className="small text-secondary mb-0">{t.tasks[task.key].description}</p>
          <div className="mt-auto d-grid gap-2">
            <Link className="btn btn-outline-primary btn-sm" href={destinations[task.key]}>{t.open}</Link>
            <label className="form-label small mb-0" htmlFor={"configuration-"+task.key}>{t.fieldLabel}</label>
            <select className="form-select form-select-sm" id={"configuration-"+task.key}
              disabled={pending!==null} value={task.status}
              onChange={e=>void change(task.key,e.target.value as ConfigurationStatus)}>
              <option value="todo">{t.status.todo}</option>
              <option value="done">{t.status.done}</option>
              <option value="ignored">{t.status.ignored}</option>
            </select>
          </div>
        </article>
      </div>)}
    </div>
    {pending&&<p role="status" className="small text-secondary mt-2">{t.saving}</p>}
  </section>;
}
