"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {useLocale,useTranslation} from "@/i18n/client";
import {translateBootstrapStep,translateBootstrapError} from "@/i18n/catalog";
type Status = { status: "idle" | "working" | "complete" | "failed"; step: string; progress: number; error: string | null };
const init: Status = { status: "idle", step: "", progress: 0, error: null };

export default function SetupWelcome() {
  const t=useTranslation();
  const locale=useLocale();
  const [dbMode, setDbMode] = useState<"existing"|"portable">("existing");
  const [postgresUser, setPostgresUser] = useState("postgres");
  const [postgresPassword, setPostgresPassword] = useState("");
  const [postgresPort, setPostgresPort] = useState("5432");
  const [adminEmail, setAdminEmail] = useState("admin@localhot.com");
  const [adminUsername, setAdminUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [confirmed, setConfirmed] = useState(false);
  const [recoveryApproved, setRecoveryApproved] = useState(false);
  const [status, setStatus] = useState<Status>(init);
  const [message, setMessage] = useState("");
  const needsRecovery = dbMode === "portable" && status.status === "failed" && status.error === "managed-cluster-needs-recovery";
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const r = await fetch("/api/bootstrap", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const data = (await r.json()) as Status;
        if (active) {
          setStatus(data);
          if (data.status === "complete") { setPassword(""); setPostgresPassword(""); }
        }
      } catch { if (active) setMessage(t("welcome.readFailed")); }
    };
    void refresh();
    const handle = setInterval(() => { void refresh(); }, 1200);
    return () => { active = false; clearInterval(handle); };
  }, [t]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (needsRecovery && !recoveryApproved) {
      setMessage(t("welcome.confirmRecovery"));
      return;
    }
    setMessage("");
    try {
      const r = await fetch("/api/bootstrap", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbMode, postgresUser, postgresPassword, postgresPort: Number(postgresPort),
          password, adminEmail, adminUsername, confirmed,
          recoverPartial: needsRecovery && recoveryApproved }),
      });
      const data = await r.json() as { status: string };
      if (r.status !== 202) {
        setMessage(translateBootstrapError(locale,data.status));
        return;
      }
      setRecoveryApproved(false);
      setStatus({ status: "working", step: "", progress: 5, error: null });
    } catch { setMessage(t("welcome.network")); }
  }
  if (status.status === "complete") return <div role="status" className="alert alert-success">
    <h2 className="h5">{t("welcome.complete")}</h2>
    <p>{t("welcome.completeInfo")}</p>
    <Link href="/" className="btn btn-outline-primary">{t("welcome.back")}</Link>
  </div>;
  return <form onSubmit={submit} className="d-grid gap-3" aria-describedby={message?"welcome-feedback":undefined}>
    <fieldset disabled={status.status === "working"} className="d-grid gap-3">
      <h2 className="h5">{t("welcome.dbConnection")}</h2>
      <label className="form-label">{t("welcome.installationType")}
        <select className="form-select" value={dbMode} onChange={e=>setDbMode(e.target.value as "existing"|"portable")}>
          <option value="existing">{t("welcome.existing")}</option>
          <option value="portable">{t("welcome.portable")}</option>
        </select>
      </label>
      {dbMode === "existing" && <>
        <label className="form-label">{t("welcome.postgresUser")}
          <input required className="form-control" autoComplete="username" value={postgresUser} onChange={e=>setPostgresUser(e.target.value)}/>
        </label>
        <label className="form-label">{t("welcome.postgresPassword")}
          <input required type="password" className="form-control" autoComplete="current-password" value={postgresPassword} onChange={e=>setPostgresPassword(e.target.value)}/>
        </label>
        <label className="form-label">{t("welcome.postgresPort")}
          <input required type="number" min={1} max={65535} className="form-control" value={postgresPort} onChange={e=>setPostgresPort(e.target.value)}/>
        </label>
        <p className="small text-secondary">{t("welcome.dbExistingInfo")}</p>
      </>}
      {dbMode === "portable" && <p className="small text-secondary">{t("welcome.dbPortableInfo")}</p>}
      <h2 className="h5">{t("welcome.admin")}</h2>
      <label className="form-label">{t("welcome.email")}
        <input required type="email" className="form-control" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)}/>
      </label>
      <label className="form-label">{t("welcome.username")}
        <input required minLength={2} maxLength={50} className="form-control" value={adminUsername} onChange={e=>setAdminUsername(e.target.value)}/>
      </label>
      <label className="form-label">{t("welcome.password")}
        <input required minLength={4} maxLength={256} type="password" autoComplete="new-password" className="form-control" aria-describedby={password==="admin"?"welcome-pilot-warning":undefined} value={password} onChange={e=>setPassword(e.target.value)}/>
      </label>
      {password === "admin" && <p id="welcome-pilot-warning" role="note" className="small text-warning">{t("welcome.pilotWarning")}</p>}
      <label className="form-check">
        <input type="checkbox" className="form-check-input" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
        <span className="form-check-label">{t("welcome.confirmation")}</span>
      </label>
      {needsRecovery && (
        <div className="alert alert-info">
          <p><strong>{t("welcome.recoveryTitle")}</strong></p>
          <p>{t("welcome.recoveryBefore")}
            <code> %LOCALAPPDATA%\\ScrumMasterNotebook\\recovery </code>
            {t("welcome.recoveryAfter")}</p>
          <label className="form-check">
            <input type="checkbox" className="form-check-input" checked={recoveryApproved}
              onChange={e=>setRecoveryApproved(e.target.checked)}/>
            <span className="form-check-label">{t("welcome.recoveryAccept")}</span>
          </label>
        </div>
      )}
      <button className="btn btn-primary" type="submit"
        disabled={!confirmed || (needsRecovery && !recoveryApproved)}>
        {t(needsRecovery?"welcome.resume":"welcome.install")}
      </button>
    </fieldset>
    {(status.status === "working" || status.status === "failed") && <section aria-live="polite">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>{t("welcome.progress")}</strong><span>{status.progress}%</span>
      </div>
      <div className="progress" role="progressbar" aria-label={t("welcome.progressAria")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={status.progress}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: status.progress + "%" }}/>
      </div>
      <p className="mt-2">{translateBootstrapStep(locale,status.step)}</p>
    </section>}
    {status.status === "failed" && <div role="alert" className="alert alert-warning">
      <p className="mb-1">{translateBootstrapError(locale,status.error)}</p>
      {status.error?.startsWith("managed-pg-") && <p className="small mb-0">
        {t("welcome.logBefore")}
        <code> %LOCALAPPDATA%\\ScrumMasterNotebook\\postgres.log </code>.
        {t("welcome.logAfter")}
      </p>}
    </div>}
    {message && <p id="welcome-feedback" role="alert">{message}</p>}
  </form>;
}
