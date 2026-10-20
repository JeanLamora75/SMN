"use client";
import { useEffect, useState, type FormEvent } from "react";
type Status = { status: "idle" | "working" | "complete" | "failed"; step: string; error: string | null };
const init: Status = { status: "idle", step: "", error: null };
const errors: Record<string,string> = {
  "windows-required": "L’installation portable est actuellement disponible sur Windows 11 uniquement.",
  "manual-connection-configured": "Cette version utilise une configuration PostgreSQL manuelle. Consultez le diagnostic.",
  "managed-config-invalid": "L’installation existante ne peut pas être vérifiée. Aucune donnée n’a été supprimée.",
  "managed-cluster-needs-recovery": "Un dossier de données existe déjà. Pour éviter de l’écraser, une vérification est nécessaire.",
  "managed-port-occupied": "Le port réservé à la base SMN est occupé. Fermez le logiciel en conflit puis réessayez.",
  "postgres-archive-invalid": "Le fichier PostgreSQL n’a pas réussi son contrôle d’intégrité.",
  "postgres-download-unavailable": "Téléchargement des composants indisponible. Vérifiez la connexion Internet.",
  "postgres-runtime-invalid": "Les composants PostgreSQL ne sont pas valides.",
  "installation-failed": "La préparation a échoué. Les données existantes n’ont pas été réinitialisées.",
  "already-running": "Une installation est déjà en cours.",
  "invalid-input": "Vérifiez les informations renseignées.",
};
export default function SetupWelcome() {
  const [mode, setMode] = useState("scrum");
  const [product, setProduct] = useState("");
  const [team, setTeam] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<Status>(init);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    let handle: ReturnType<typeof setInterval> | undefined;
    async function refresh() {
      try {
        const r = await fetch("/api/bootstrap", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const data = (await r.json()) as Status;
        if (active) setStatus(data);
        if (data.status === "working" || data.status === "idle") return;
        if (handle) clearInterval(handle);
      } catch { if (active) setMessage("Impossible de lire l’état de l’installation."); }
    }
    void refresh();
    handle = setInterval(() => { void refresh(); }, 1800);
    return () => { active = false; if (handle) clearInterval(handle); };
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmation) { setMessage("Les deux mots de passe sont différents."); return; }
    setMessage("");
    try {
      const r = await fetch("/api/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, product, team, password, confirmed }) });
      const data = await r.json() as { status: string };
      if (r.status !== 202) { setMessage(errors[data.status] ?? "L’installation n’a pas pu démarrer."); return; }
      setPassword(""); setConfirmation("");
      setStatus({ status: "working", step: "Préparation de SMN", error: null });
    } catch { setMessage("Connexion au serveur SMN impossible."); }
  }
  if (status.status === "complete") return <div role="status" className="alert alert-success">
    <h2 className="h5">Installation réussie</h2>
    <p>Votre produit, votre équipe et votre compte administrateur ont été créés. La connexion et le tableau de bord seront disponibles dans SMN-14.</p>
    <a href="/" className="btn btn-outline-primary">Voir le diagnostic</a>
  </div>;
  return <form onSubmit={submit} className="d-grid gap-3">
    <label className="form-label">Mode de travail
      <select className="form-select" value={mode} onChange={e=>setMode(e.target.value)} disabled={status.status==="working"}>
        <option value="scrum">Scrum</option><option value="kanban">Kanban</option>
      </select>
    </label>
    <label className="form-label">Nom du produit
      <input required maxLength={120} className="form-control" value={product} onChange={e=>setProduct(e.target.value)} disabled={status.status==="working"}/>
    </label>
    <label className="form-label">Nom de l’équipe
      <input required maxLength={120} className="form-control" value={team} onChange={e=>setTeam(e.target.value)} disabled={status.status==="working"}/>
    </label>
    <p className="small text-secondary">Compte administrateur : admin@locahost.com</p>
    <label className="form-label">Mot de passe administrateur (14 caractères au minimum, lettres et chiffres)
      <input required type="password" minLength={14} maxLength={256} autoComplete="new-password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} disabled={status.status==="working"}/>
    </label>
    <label className="form-label">Confirmer le mot de passe
      <input required type="password" autoComplete="new-password" className="form-control" value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={status.status==="working"}/>
    </label>
    <label className="form-check">
      <input type="checkbox" className="form-check-input" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={status.status==="working"}/>
      <span className="form-check-label">Je confirme la création de la base et des données de SMN dans mon profil Windows, sans modifier mes autres applications.</span>
    </label>
    <button className="btn btn-primary" type="submit" disabled={!confirmed || status.status==="working"}>
      {status.status==="working" ? "Installation en cours…" : "Installer SMN"}
    </button>
    {status.status==="working" && <div role="status" className="alert alert-info">{status.step}</div>}
    {status.status==="failed" && <div role="alert" className="alert alert-warning">
      {errors[status.error ?? ""] ?? "Une vérification a échoué. Aucune réinitialisation automatique n’a été lancée."}
    </div>}
    {message && <p role="alert">{message}</p>}
  </form>;
}
