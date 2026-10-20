"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
type Status = { status: "idle" | "working" | "complete" | "failed"; step: string; progress: number; error: string | null };
const init: Status = { status: "idle", step: "", progress: 0, error: null };
const errors: Record<string,string> = {
  "windows-required": "L’installation locale est actuellement disponible sur Windows uniquement.",
  "manual-connection-configured": "SMN utilise déjà une configuration PostgreSQL manuelle.",
  "managed-config-invalid": "La configuration de l’instance SMN existante est invalide. Aucune donnée n’a été supprimée.",
  "managed-cluster-needs-recovery": "Une précédente tentative a créé un dossier PostgreSQL sans terminer la configuration. Vous pouvez conserver ce dossier puis reprendre l’installation.",
  "managed-cluster-running": "Le serveur PostgreSQL SMN est encore en cours d’exécution : il ne peut pas être déplacé.",
  "managed-cluster-running-or-unclean": "Le dossier PostgreSQL semble utilisé ou contient une trace d’arrêt incomplet. Aucune opération n’a été effectuée.",
  "managed-cluster-unsafe": "Le dossier PostgreSQL n’est pas un dossier ordinaire de SMN : aucune reprise automatique n’est possible.",
  "managed-port-occupied": "Le port PostgreSQL privé de SMN (55432) est occupé.",
  "postgres-archive-invalid": "L’archive PostgreSQL a échoué au contrôle d’intégrité.",
  "postgres-download-unavailable": "Impossible de récupérer les fichiers PostgreSQL.",
  "postgres-runtime-invalid": "Les fichiers PostgreSQL portables ne sont pas valides.",
  "postgres-auth-invalid": "Identifiant ou mot de passe PostgreSQL incorrect.",
  "postgres-unreachable": "Le serveur PostgreSQL local ne répond pas sur le port indiqué. Vérifiez qu’il est démarré.",
  "postgres-connection-failed": "Connexion PostgreSQL impossible. Vérifiez le port et les informations de connexion.",
  "postgres-permission-denied": "Le compte PostgreSQL n’a pas les droits nécessaires.",
  "postgres-credentials-invalid": "Renseignez un utilisateur, un mot de passe et un port PostgreSQL valides.",
  "createdb-required": "Le compte PostgreSQL doit posséder l’autorisation de créer la base SMN.",
  "permissions-insufficient": "Droits PostgreSQL insuffisants pour créer les tables SMN.",
  "server-version-unsupported": "PostgreSQL 18 est requis.",
  "unsupported-postgres": "PostgreSQL 18 est requis.",
  "database-already-present": "La base SMN existe déjà : relancez le diagnostic avant toute modification.",
  "schema-incompatible": "La base cible contient un schéma inconnu. Aucune modification n’a été effectuée.",
  "installation-incomplete": "Une installation partielle a été détectée. SMN ne la réinitialise pas automatiquement.",
  "not-empty": "La base contient déjà des objets. SMN refuse de les modifier.",
  "verification-failed": "La base a été écrite, mais la vérification finale a échoué. N’essayez pas de réinitialiser.",
  "installation-failed": "Impossible d’achever la création des tables ou du compte administrateur.",
  "configuration-key-invalid": "La clé locale de configuration n’est pas valide.",
  "already-running": "Une installation est déjà en cours.",
  "invalid-input": "Vérifiez les champs du formulaire.",
};
export default function SetupWelcome() {
  const [dbMode, setDbMode] = useState<"existing"|"portable">("existing");
  const [postgresUser, setPostgresUser] = useState("postgres");
  const [postgresPassword, setPostgresPassword] = useState("");
  const [postgresPort, setPostgresPort] = useState("5432");
  const [mode, setMode] = useState("scrum");
  const [product, setProduct] = useState("");
  const [team, setTeam] = useState("");
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
      } catch { if (active) setMessage("Impossible de lire l’état de l’installation."); }
    };
    void refresh();
    const handle = setInterval(() => { void refresh(); }, 1200);
    return () => { active = false; clearInterval(handle); };
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (needsRecovery && !recoveryApproved) {
      setMessage("Confirmez la conservation de l’ancienne tentative avant de reprendre.");
      return;
    }
    setMessage("");
    try {
      const r = await fetch("/api/bootstrap", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbMode, postgresUser, postgresPassword, postgresPort: Number(postgresPort),
          mode, product, team, password, adminEmail, adminUsername, confirmed,
          recoverPartial: needsRecovery && recoveryApproved }),
      });
      const data = await r.json() as { status: string };
      if (r.status !== 202) {
        setMessage(errors[data.status] ?? "L’installation n’a pas pu démarrer.");
        return;
      }
      setRecoveryApproved(false);
      setStatus({ status: "working", step: "Vérification des informations", progress: 5, error: null });
    } catch { setMessage("Connexion au serveur SMN impossible."); }
  }
  if (status.status === "complete") return <div role="status" className="alert alert-success">
    <h2 className="h5">Installation terminée</h2>
    <p>La base SMN, le produit, l’équipe et le compte administrateur ont été créés. L’accès au tableau de bord sera disponible avec SMN-14.</p>
    <Link href="/" className="btn btn-outline-primary">Retour à l’accueil</Link>
  </div>;
  return <form onSubmit={submit} className="d-grid gap-3">
    <fieldset disabled={status.status === "working"} className="d-grid gap-3">
      <h2 className="h5">Connexion PostgreSQL</h2>
      <label className="form-label">Type d’installation
        <select className="form-select" value={dbMode} onChange={e=>setDbMode(e.target.value as "existing"|"portable")}>
          <option value="existing">Utiliser PostgreSQL déjà installé</option>
          <option value="portable">Installer un PostgreSQL dédié à SMN</option>
        </select>
      </label>
      {dbMode === "existing" && <>
        <label className="form-label">Nom d’utilisateur PostgreSQL
          <input required className="form-control" autoComplete="username" value={postgresUser} onChange={e=>setPostgresUser(e.target.value)}/>
        </label>
        <label className="form-label">Mot de passe PostgreSQL
          <input required type="password" className="form-control" autoComplete="current-password" value={postgresPassword} onChange={e=>setPostgresPassword(e.target.value)}/>
        </label>
        <label className="form-label">Port PostgreSQL
          <input required type="number" min={1} max={65535} className="form-control" value={postgresPort} onChange={e=>setPostgresPort(e.target.value)}/>
        </label>
        <p className="small text-secondary">SMN créera uniquement sa base « smn » sur ce serveur. La configuration sera conservée localement dans votre profil Windows, avec le mot de passe chiffré.</p>
      </>}
      {dbMode === "portable" && <p className="small text-secondary">SMN créera une instance PostgreSQL privée, avec un mot de passe technique généré automatiquement.</p>}
      <h2 className="h5">Votre espace de travail</h2>
      <label className="form-label">Mode
        <select className="form-select" value={mode} onChange={e=>setMode(e.target.value)}>
          <option value="scrum">Scrum</option><option value="kanban">Kanban</option>
        </select>
      </label>
      <label className="form-label">Produit
        <input required maxLength={120} className="form-control" value={product} onChange={e=>setProduct(e.target.value)}/>
      </label>
      <label className="form-label">Équipe
        <input required maxLength={120} className="form-control" value={team} onChange={e=>setTeam(e.target.value)}/>
      </label>
      <h2 className="h5">Compte administrateur</h2>
      <label className="form-label">Adresse e-mail
        <input required type="email" className="form-control" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)}/>
      </label>
      <label className="form-label">Nom d’utilisateur
        <input required minLength={2} maxLength={50} className="form-control" value={adminUsername} onChange={e=>setAdminUsername(e.target.value)}/>
      </label>
      <label className="form-label">Mot de passe
        <input required minLength={4} maxLength={256} type="password" autoComplete="new-password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)}/>
      </label>
      {password === "admin" && <p className="small text-warning">Le mot de passe par défaut « admin » convient uniquement au pilote local. Pensez à le modifier avant toute utilisation réelle.</p>}
      <label className="form-check">
        <input type="checkbox" className="form-check-input" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
        <span className="form-check-label">Je confirme la création de la base et des données SMN.</span>
      </label>
      {needsRecovery && (
        <div className="alert alert-info">
          <p><strong>Une ancienne tentative d’installation a été détectée.</strong></p>
          <p>SMN peut déplacer le dossier de données incomplet vers
            <code> %LOCALAPPDATA%\\ScrumMasterNotebook\\recovery </code>
            pour le conserver, puis créer une nouvelle instance PostgreSQL. Aucun fichier existant n’est supprimé.
            Cette opération concerne uniquement l’instance privée de SMN, pas votre PostgreSQL habituel.</p>
          <label className="form-check">
            <input type="checkbox" className="form-check-input" checked={recoveryApproved}
              onChange={e=>setRecoveryApproved(e.target.checked)}/>
            <span className="form-check-label">J’autorise SMN à mettre de côté son ancienne tentative d’installation et à recommencer.</span>
          </label>
        </div>
      )}
      <button className="btn btn-primary" type="submit"
        disabled={!confirmed || (needsRecovery && !recoveryApproved)}>
        {needsRecovery ? "Conserver l’ancienne tentative et reprendre" : "Installer SMN"}
      </button>
    </fieldset>
    {(status.status === "working" || status.status === "failed") && <section aria-live="polite">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>Progression de l’installation</strong><span>{status.progress}%</span>
      </div>
      <div className="progress" role="progressbar" aria-label="Installation SMN" aria-valuemin={0} aria-valuemax={100} aria-valuenow={status.progress}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: status.progress + "%" }}/>
      </div>
      <p className="mt-2">{status.step}</p>
    </section>}
    {status.status === "failed" && <p role="alert" className="alert alert-warning">
      {errors[status.error ?? ""] ?? "Une erreur est survenue : " + (status.error ?? "inconnue") + ". Aucune donnée existante n’a été supprimée."}
    </p>}
    {message && <p role="alert">{message}</p>}
  </form>;
}
