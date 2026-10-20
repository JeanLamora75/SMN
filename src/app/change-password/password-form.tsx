"use client";
import { useState, type FormEvent } from "react";
import LogoutControl from "../app/logout-control";
export default function PasswordChangeForm() {
  const [currentPassword,setCurrentPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [confirmation,setConfirmation] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmation) { setError("La confirmation du mot de passe ne correspond pas."); return; }
    if (currentPassword === newPassword) { setError("Choisissez un mot de passe différent de l’ancien."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/change-password", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({currentPassword,newPassword}),cache:"no-store",
      });
      const r = await response.json() as {ok?:boolean;error?:string};
      if (r.ok) { window.location.assign("/app"); return; }
      setError(r.error === "unauthorized" ? "Votre session a expiré. Reconnectez-vous."
        : r.error === "service-unavailable" ? "La base SMN est indisponible."
        : "Le mot de passe actuel est incorrect ou le nouveau mot de passe n’est pas autorisé.");
    } catch { setError("Impossible de joindre SMN."); }
    finally { setBusy(false); }
  }
  return <div className="d-grid gap-3">
    <form onSubmit={submit} className="d-grid gap-3">
      <label className="form-label">Mot de passe actuel
        <input className="form-control" type="password" required autoComplete="current-password"
          value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} disabled={busy}/>
      </label>
      <label className="form-label">Nouveau mot de passe
        <input className="form-control" type="password" required autoComplete="new-password" minLength={4}
          value={newPassword} onChange={e=>setNewPassword(e.target.value)} disabled={busy}/>
      </label>
      <label className="form-label">Confirmer le nouveau mot de passe
        <input className="form-control" type="password" required autoComplete="new-password" minLength={4}
          value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/>
      </label>
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Enregistrement…" : "Enregistrer et accéder à SMN"}
      </button>
      {error && <p role="alert" className="alert alert-warning">{error}</p>}
    </form>
    <LogoutControl/>
  </div>;
}
