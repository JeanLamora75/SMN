"use client";

import { useState, type FormEvent } from "react";
const installationErrors: Record<string,string> = {
  "invalid-input": "Vérifiez les noms et le mot de passe (au moins 14 caractères, avec lettres et chiffres).",
  "configuration-missing": "La connexion PostgreSQL SMN n’est pas configurée.",
  "configuration-invalid": "La connexion configurée ne désigne pas une base SMN locale dédiée.",
  "database-missing": "La base SMN n’existe pas encore.",
  "createdb-required": "Ce compte PostgreSQL n’a pas le droit CREATEDB. Utilisez un compte autorisé ou une base SMN dédiée précréée.",
  "postgres-error": "Connexion à PostgreSQL impossible ou autorisation insuffisante. Vérifiez les droits et réessayez.",
  "permissions-insufficient": "Le compte PostgreSQL ne possède pas les droits nécessaires dans la base SMN.",
  "schema-incompatible": "La base contient un schéma non reconnu. Aucune modification automatique n’a été effectuée.",
  "installation-incomplete": "Une installation partielle est détectée. Aucune seconde installation n’est autorisée.",
  "not-empty": "La base n’est plus vierge. Rechargez le diagnostic avant toute nouvelle tentative.",
  "database-already-present": "La base est apparue entre deux vérifications. Rechargez le diagnostic.",
  "unsupported-postgres": "La version PostgreSQL requise est 18.",
  "installation-failed": "L’amorçage a échoué. Les modifications de la transaction ont été annulées ; consultez le diagnostic.",
  "verification-failed": "Les écritures sont terminées mais la vérification finale a échoué : n’essayez pas de réinitialiser ; consultez le diagnostic.",
  "forbidden": "Jeton local ou origine de la requête invalide.",
  "confirmation-required": "Confirmez explicitement l’installation avant de continuer.",
};


export default function SetupForm() {
  const [state, setState] = useState({ mode: "scrum", product: "", team: "", password: "", setupToken: "", confirmed: false });
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.password !== passwordConfirmation) { setResult("Les mots de passe ne correspondent pas."); return; }
    setBusy(true); setResult("");
    try {
      const response = await fetch("/api/setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state), cache: "no-store",
      });
      const message = (await response.json()) as { ok?: boolean; status?: string };
      setResult(message.ok
        ? "Installation réussie. L'accès au tableau de bord sera activé avec SMN-14."
        : "Installation non terminée : " + (message.status ?? "erreur") + ". Aucune session n'a été créée.");
      if (message.ok) {
        setState((v) => ({ ...v, password: "", setupToken: "" }));
        setPasswordConfirmation("");
      }
    } catch { setResult("Connexion indisponible. Vérifiez les prérequis et réessayez."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="d-grid gap-3">
    <label className="form-label">Mode de travail
      <select className="form-select" value={state.mode} onChange={(e)=>setState({...state,mode:e.target.value})}>
        <option value="scrum">Scrum</option><option value="kanban">Kanban</option>
      </select>
    </label>
    <label className="form-label">Nom du produit
      <input required maxLength={120} className="form-control" value={state.product} onChange={(e)=>setState({...state,product:e.target.value})}/>
    </label>
    <label className="form-label">Nom de l’équipe
      <input required maxLength={120} className="form-control" value={state.team} onChange={(e)=>setState({...state,team:e.target.value})}/>
    </label>
    <p className="small text-secondary">Compte administrateur : admin@locahost.com. Aucun mot de passe n’est fourni par défaut.</p>
    <label className="form-label">Mot de passe administrateur initial (14 caractères minimum, lettres et chiffres)
      <input required minLength={14} maxLength={256} type="password" autoComplete="new-password" className="form-control" value={state.password} onChange={(e)=>setState({...state,password:e.target.value})}/>
    </label>
    <label className="form-label">Confirmer le mot de passe Administrateur
      <input required type="password" autoComplete="new-password" className="form-control" value={passwordConfirmation} onChange={(e)=>setPasswordConfirmation(e.target.value)}/>
    </label>
    <label className="form-label">Jeton local d’installation (SMN_SETUP_TOKEN)
      <input required type="password" autoComplete="off" className="form-control" value={state.setupToken} onChange={(e)=>setState({...state,setupToken:e.target.value})}/>
    </label>
    <div className="form-check">
      <input className="form-check-input" id="confirm-init" type="checkbox" checked={state.confirmed} onChange={(e)=>setState({...state,confirmed:e.target.checked})}/>
      <label className="form-check-label" htmlFor="confirm-init">Je confirme la création éventuelle de la base SMN dédiée et l’application de son schéma initial.</label>
    </div>
    <button className="btn btn-primary" disabled={busy || !state.confirmed}>{busy ? "Installation en cours…" : "Initialiser SMN"}</button>
    {result && <p role="status">{result}</p>}
  </form>;
}
