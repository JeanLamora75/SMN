"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Status = {
  status: "idle" | "working" | "complete" | "failed";
  step: string; progress: number; error: string | null;
};
const init: Status = { status: "idle", step: "", progress: 0, error: null };
const errors: Record<string,string> = {
  "windows-required": "L’installation locale nécessite Windows.",
  "manual-connection-configured": "Une ancienne configuration PostgreSQL manuelle est encore active. Redémarrez SMN sans cette configuration.",
  "managed-config-invalid": "Une installation PostgreSQL SMN existe, mais sa configuration est invalide. Elle n’a pas été modifiée.",
  "managed-cluster-needs-recovery": "Des données PostgreSQL SMN existent déjà sans configuration utilisable. Elles sont conservées : vérifiez ce répertoire avant de réessayer.",
  "managed-port-occupied": "Le port PostgreSQL réservé à SMN (55432) est occupé.",
  "postgres-archive-invalid": "Le fichier PostgreSQL portable n’a pas réussi la vérification d’intégrité.",
  "postgres-download-unavailable": "Impossible de récupérer les composants PostgreSQL.",
  "postgres-runtime-invalid": "Les composants PostgreSQL portables sont incomplets.",
  "postgres-credentials-invalid": "Vérifiez le nom d’utilisateur, le mot de passe et le port PostgreSQL.",
  "createdb-required": "Ce compte PostgreSQL ne dispose pas du droit de créer la base SMN (CREATEDB).",
  "unsupported-postgres": "Cette version de SMN nécessite PostgreSQL 18.",
  "database-already-present": "La base SMN est apparue pendant l'installation. Actualisez le diagnostic.",
  "database-missing": "La base SMN est absente et n’a pas pu être créée.",
  "installation-incomplete": "Une installation incomplète est détectée. Les données existantes restent préservées.",
  "schema-incompatible": "La base SMN contient déjà un schéma non reconnu. Rien n’a été effacé.",
  "not-empty": "La base SMN n’est pas vierge. Aucune réinitialisation automatique n’est autorisée.",
  "permissions-insufficient": "Le compte PostgreSQL ne dispose pas des autorisations nécessaires.",
  "connection-error": "Connexion PostgreSQL impossible. Vérifiez le serveur, le port, l’utilisateur et le mot de passe.",
  "postgres-error": "Impossible de joindre PostgreSQL ou de créer la base SMN avec ce compte.",
  "installation-failed": "L’installation a échoué. Vérifiez la disponibilité de PostgreSQL et les droits du compte. Aucune réinitialisation automatique n’a été réalisée.",
  "verification-failed": "Les écritures ont été effectuées mais leur vérification n’a pas abouti. Ne réinitialisez pas la base.",
  "postgres-config-invalid": "Le fichier de configuration PostgreSQL est illisible ou invalide.",
  "configuration-key-invalid": "La clé de protection des paramètres est invalide.",
  "configuration-encrypted-invalid": "La configuration chiffrée est invalide.",
  "invalid-input-or-running": "Les informations sont invalides ou une installation est déjà en cours.",
};
export default function SetupWelcome() {
  const [mode, setMode] = useState("scrum");
  const [databaseMode, setDatabaseMode] = useState<"existing" | "portable">("existing");
  const [postgresUser, setPostgresUser] = useState("postgres");
  const [postgresPassword, setPostgresPassword] = useState("");
  const [postgresPort, setPostgresPort] = useState("5432");
  const [product, setProduct] = useState("");
  const [team, setTeam] = useState("");
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminEmail, setAdminEmail] = useState("admin@localhot.com");
  const [password, setPassword] = useState("admin");
  const [confirmation, setConfirmation] = useState("admin");
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState<Status>(init);
  const [message, setMessage] = useState("");
  const busy = status.status === "working";

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const r = await fetch("/api/bootstrap", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const data = (await r.json()) as Status;
        if (active) setStatus(data);
      } catch {
        if (active) setMessage("Impossible de lire l’état de l’installation. Vérifiez que le serveur SMN est démarré.");
      }
    };
    void refresh();
    const interval = setInterval(() => { void refresh(); }, 1500);
    return () => { active = false; clearInterval(interval); };
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmation) {
      setMessage("Les deux mots de passe Administrateur ne correspondent pas.");
      return;
    }
    if (databaseMode === "existing" && (!postgresUser.trim() || !postgresPassword)) {
      setMessage("Renseignez l’utilisateur et le mot de passe PostgreSQL.");
      return;
    }
    setMessage("");
    try {
      const r = await fetch("/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          databaseMode, postgresUser: databaseMode === "existing" ? postgresUser : undefined,
          postgresPassword: databaseMode === "existing" ? postgresPassword : undefined,
          postgresPort: databaseMode === "existing" ? Number(postgresPort) : undefined,
          mode, product, team, adminUsername, adminEmail, password, confirmed,
        }),
      });
      const data = await r.json() as { status: string };
      if (r.status !== 202) {
        setMessage(errors[data.status] ?? "L’installation n’a pas pu démarrer. Vérifiez les champs saisis.");
        return;
      }
      setPostgresPassword("");
      setPassword(""); setConfirmation("");
      setStatus({ status: "working", step: "Vérification des informations", progress: 5, error: null });
    } catch {
      setMessage("Le serveur SMN n’est pas joignable.");
    }
  }
  if (status.status === "complete") {
    return <section role="status" className="alert alert-success">
      <h2 className="h5">Installation terminée</h2>
      <p>Votre produit, votre équipe et le compte Administrateur ont été enregistrés. La connexion au tableau de bord sera livrée avec SMN-14.</p>
      <Link className="btn btn-outline-primary" href="/">Retour à l’accueil</Link>
    </section>;
  }
  return <form onSubmit={submit} className="d-grid gap-3">
    <fieldset disabled={busy} className="d-grid gap-3">
      <legend className="h5">Base de données PostgreSQL</legend>
      <label className="form-label">Configuration PostgreSQL
        <select className="form-select" value={databaseMode} onChange={e=>setDatabaseMode(e.target.value as "existing" | "portable")}>
          <option value="existing">Utiliser mon PostgreSQL existant (recommandé si déjà installé)</option>
          <option value="portable">Installer automatiquement un PostgreSQL dédié à SMN</option>
        </select>
      </label>
      {databaseMode === "existing" && <>
        <p className="small text-secondary mb-0">SMN utilisera uniquement une base nommée <strong>smn</strong> sur votre serveur local. Le compte PostgreSQL doit pouvoir créer cette base.</p>
        <label className="form-label">Utilisateur PostgreSQL
          <input className="form-control" required maxLength={63} autoComplete="off"
            value={postgresUser} onChange={e=>setPostgresUser(e.target.value)}/>
        </label>
        <label className="form-label">Mot de passe PostgreSQL
          <input className="form-control" type="password" required autoComplete="off"
            value={postgresPassword} onChange={e=>setPostgresPassword(e.target.value)}/>
        </label>
        <label className="form-label">Port PostgreSQL
          <input className="form-control" type="number" min={1} max={65535} required
            value={postgresPort} onChange={e=>setPostgresPort(e.target.value)}/>
        </label>
      </>}
      <hr/>
      <h2 className="h5">Configuration de Scrum Master Notebook</h2>
      <label className="form-label">Mode de travail
        <select className="form-select" value={mode} onChange={e=>setMode(e.target.value)}>
          <option value="scrum">Scrum</option><option value="kanban">Kanban</option>
        </select>
      </label>
      <label className="form-label">Nom du produit
        <input required maxLength={120} className="form-control"
          value={product} onChange={e=>setProduct(e.target.value)}/>
      </label>
      <label className="form-label">Nom de l’équipe
        <input required maxLength={120} className="form-control"
          value={team} onChange={e=>setTeam(e.target.value)}/>
      </label>
      <hr/>
      <h2 className="h5">Compte Administrateur initial</h2>
      <label className="form-label">Nom d’utilisateur
        <input required maxLength={50} className="form-control"
          value={adminUsername} onChange={e=>setAdminUsername(e.target.value)}/>
      </label>
      <label className="form-label">Adresse e-mail
        <input type="email" required maxLength={200} className="form-control"
          value={adminEmail} onChange={e=>setAdminEmail(e.target.value)}/>
      </label>
      <label className="form-label">Mot de passe Administrateur
        <input required minLength={4} maxLength={256} type="password" autoComplete="new-password"
          className="form-control" value={password} onChange={e=>setPassword(e.target.value)}/>
      </label>
      <label className="form-label">Confirmer le mot de passe Administrateur
        <input required minLength={4} type="password" autoComplete="new-password"
          className="form-control" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/>
      </label>
      <p className="small text-secondary">Les valeurs admin / admin sont prévues pour ce pilote local. Un changement de mot de passe sera obligatoire avant l’utilisation métier lorsque la connexion sera disponible.</p>
      <label className="form-check">
        <input type="checkbox" className="form-check-input" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
        <span className="form-check-label">Je confirme la création de la base SMN si nécessaire et l’initialisation de mon application.</span>
      </label>
    </fieldset>
    <button className="btn btn-primary" type="submit" disabled={!confirmed || busy}>
      {busy ? "Installation en cours…" : "Installer SMN"}
    </button>
    {(busy || status.status === "failed") && <section aria-label="Progression de l'installation">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>Progression de l’installation</strong>
        <span>{status.progress}%</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={status.progress} aria-valuemin={0} aria-valuemax={100}>
        <div className={"progress-bar" + (busy ? " progress-bar-striped progress-bar-animated" : " bg-warning")}
          style={{ width: status.progress + "%" }}/>
      </div>
      <p role="status" className="small mt-2">{status.step}</p>
    </section>}
    {status.status === "failed" && <div role="alert" className="alert alert-warning">
      {errors[status.error ?? ""] ?? "L’installation a échoué. Vérifiez PostgreSQL et réessayez sans effacer les données existantes."}
    </div>}
    {message && <p role="alert" className="alert alert-warning">{message}</p>}
  </form>;
}
