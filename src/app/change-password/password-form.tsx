"use client";
import { useState, type FormEvent } from "react";
import LogoutControl from "../app/logout-control";
import {useTranslation} from "@/i18n/client";
export default function PasswordChangeForm() {
  const t=useTranslation();
  const [currentPassword,setCurrentPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [confirmation,setConfirmation] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmation) { setError(t("password.mismatch")); return; }
    if (currentPassword === newPassword) { setError(t("password.same")); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/change-password", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({currentPassword,newPassword}),cache:"no-store",
      });
      const r = await response.json() as {ok?:boolean;error?:string};
      if (r.ok) { window.location.assign("/app"); return; }
      setError(t(r.error === "unauthorized"?"password.unauthorized":r.error === "service-unavailable"?"password.service":"password.invalid"));
    } catch { setError(t("password.network")); }
    finally { setBusy(false); }
  }
  return <div className="d-grid gap-3">
    <form onSubmit={submit} className="d-grid gap-3">
      <label className="form-label">{t("password.current")}
        <input className="form-control" type="password" required autoComplete="current-password"
          value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} disabled={busy}/>
      </label>
      <label className="form-label">{t("password.new")}
        <input className="form-control" type="password" required autoComplete="new-password" minLength={4}
          value={newPassword} onChange={e=>setNewPassword(e.target.value)} disabled={busy}/>
      </label>
      <label className="form-label">{t("password.confirm")}
        <input className="form-control" type="password" required autoComplete="new-password" minLength={4}
          value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/>
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {t(busy?"password.saving":"password.save")}
      </button>
      {error && <p role="alert" className="alert alert-warning">{error}</p>}
    </form>
    <LogoutControl/>
  </div>;
}
