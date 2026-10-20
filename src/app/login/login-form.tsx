"use client";
import { useState, type FormEvent } from "react";
export default function LoginForm() {
  const [identity,setIdentity] = useState("admin");
  const [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({identity,password}), cache:"no-store",
      });
      const result = await response.json() as { ok?:boolean; error?:string; mustChangePassword?:boolean };
      if (result.ok) {
        window.location.assign(result.mustChangePassword ? "/change-password" : "/app");
        return;
      }
      setError(result.error === "too-many-attempts"
        ? "Trop de tentatives. Réessayez dans quinze minutes."
        : result.error === "service-unavailable"
          ? "La base SMN n’est pas disponible. Réessayez après avoir vérifié son démarrage."
          : "Identifiant ou mot de passe incorrect.");
    } catch { setError("Connexion au serveur impossible."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="d-grid gap-3">
    <label className="form-label">Nom d’utilisateur ou adresse e-mail
      <input className="form-control" required autoComplete="username" maxLength={200}
        value={identity} onChange={e=>setIdentity(e.target.value)} disabled={busy}/>
    </label>
    <label className="form-label">Mot de passe
      <input className="form-control" required type="password" autoComplete="current-password"
        value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/>
    </label>
    <button className="btn btn-primary" type="submit" disabled={busy}>
      {busy ? "Connexion…" : "Se connecter"}
    </button>
    {error && <p role="alert" className="alert alert-warning mb-0">{error}</p>}
    <p className="small text-secondary mb-0">
      Si vous avez conservé les valeurs du pilote lors de l’installation, le compte initial est admin / admin.
      Le changement du mot de passe sera exigé avant toute page métier.
    </p>
  </form>;
}
