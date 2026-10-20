"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Role = "admin" | "user";
type Account = {
  id:string;username:string;email:string;role:Role;
  is_active:boolean;must_change_password:boolean;
};
type Status = "loading"|"ready"|"error";
const errors:Record<string,string>={
  "duplicate-account":"Ce nom d’utilisateur ou cet e-mail est déjà utilisé.",
  "invalid-input":"Vérifiez les informations du compte (mot de passe : 4 caractères minimum).",
  "last-admin":"Le dernier Administrateur actif ne peut pas être désactivé ou rétrogradé.",
  "self-protected":"Vous ne pouvez pas modifier votre propre rôle ni désactiver votre compte.",
  "account-not-found":"Ce compte n’existe plus.",
  "forbidden":"Cette opération est réservée à l’Administrateur connecté.",
  "service-unavailable":"La base SMN est actuellement indisponible.",
};
export default function UsersAdmin({selfId}:{selfId:string}) {
  const [accounts,setAccounts]=useState<Account[]>([]);
  const [status,setStatus]=useState<Status>("loading");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [role,setRole]=useState<Role>("user");
  const [edits,setEdits]=useState<Record<string,{role:Role;isActive:boolean}>>({});
  const refresh=useCallback(async()=>{
    try {
      const response=await fetch("/api/admin/accounts",{cache:"no-store"});
      if (!response.ok) throw new Error("fetch-error");
      const data=await response.json() as {accounts:Account[]};
      setAccounts(data.accounts);
      setEdits(Object.fromEntries(data.accounts.map(a=>[a.id,{role:a.role,isActive:a.is_active}])));
      setStatus("ready");
    } catch {setStatus("error");setMessage("Impossible de récupérer les comptes.");}
  },[]);
  useEffect(()=>{void Promise.resolve().then(refresh);},[refresh]);
  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/admin/accounts",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,email,password,role})});
      const data=await response.json() as {error?:string};
      if (!response.ok) {setMessage(errors[data.error??""]??"Impossible de créer le compte.");return;}
      setUsername("");setEmail("");setPassword("");setRole("user");
      setMessage("Compte créé. Communiquez le secret initial à son titulaire de manière privée. Son changement sera obligatoire à la première connexion.");
      await refresh();
    } catch {setMessage("Le serveur SMN ne répond pas.");}
    finally {setBusy(false);}
  }
  async function save(id:string) {
    const edit=edits[id];if (!edit) return;
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/admin/accounts/"+encodeURIComponent(id),{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({role:edit.role,isActive:edit.isActive})});
      const data=await response.json() as {error?:string};
      if (!response.ok) {setMessage(errors[data.error??""]??"Modification refusée.");return;}
      setMessage("Compte actualisé. Les anciennes sessions de ce compte ont été révoquées.");
      await refresh();
    } catch {setMessage("Le serveur SMN ne répond pas.");}
    finally {setBusy(false);}
  }
  return <div className="d-grid gap-4">
    <section className="smn-panel p-4">
      <h2 className="h5">Créer un compte</h2>
      <p className="small text-secondary">
        Seuls les profils Administrateur et Utilisateur existent dans le MVP. Créer un compte ne crée pas de membre d’équipe Agile.
      </p>
      <form onSubmit={create} className="row g-3">
        <div className="col-md-6"><label className="form-label">Nom d’utilisateur
          <input className="form-control" required minLength={2} maxLength={50}
            value={username} onChange={e=>setUsername(e.target.value)} disabled={busy} autoComplete="off"/>
        </label></div>
        <div className="col-md-6"><label className="form-label">Adresse e-mail
          <input className="form-control" type="email" required maxLength={200}
            value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} autoComplete="off"/>
        </label></div>
        <div className="col-md-6"><label className="form-label">Mot de passe initial
          <input className="form-control" type="password" required minLength={4} maxLength={256}
            value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} autoComplete="new-password"/>
        </label></div>
        <div className="col-md-6"><label className="form-label">Profil
          <select className="form-select" value={role} onChange={e=>setRole(e.target.value as Role)} disabled={busy}>
            <option value="user">Utilisateur</option><option value="admin">Administrateur</option>
          </select>
        </label></div>
        <div><button className="btn btn-primary" type="submit" disabled={busy}>
          {busy?"Enregistrement…":"Créer le compte"}
        </button></div>
      </form>
    </section>
    <section className="smn-panel p-4">
      <h2 className="h5">Comptes existants</h2>
      {status==="loading"&&<p>Chargement…</p>}
      {status==="error"&&<button className="btn btn-outline-secondary" onClick={()=>void refresh()}>Réessayer</button>}
      {status==="ready"&&<div className="table-responsive">
        <table className="table align-middle">
          <thead><tr><th>Utilisateur</th><th>E-mail</th><th>Profil</th><th>Accès</th><th>Action</th></tr></thead>
          <tbody>{accounts.map(account=>{
            const edit=edits[account.id]??{role:account.role,isActive:account.is_active};
            const self=account.id===selfId;
            const changed=edit.role!==account.role||edit.isActive!==account.is_active;
            return <tr key={account.id}>
              <td><strong>{account.username}</strong>{self?" (vous)":""}
                {account.must_change_password&&<div className="small text-secondary">Mot de passe initial à changer</div>}</td>
              <td>{account.email}</td>
              <td><select aria-label={"Profil de "+account.username} className="form-select form-select-sm"
                value={edit.role} disabled={busy||self} onChange={e=>
                  setEdits(prev=>({...prev,[account.id]:{...edit,role:e.target.value as Role}}))}>
                <option value="user">Utilisateur</option><option value="admin">Administrateur</option>
              </select></td>
              <td><select aria-label={"Accès de "+account.username} className="form-select form-select-sm"
                value={edit.isActive?"active":"inactive"} disabled={busy||self} onChange={e=>
                  setEdits(prev=>({...prev,[account.id]:{...edit,isActive:e.target.value==="active"}}))}>
                <option value="active">Actif</option><option value="inactive">Désactivé</option>
              </select></td>
              <td><button className="btn btn-outline-primary btn-sm" disabled={busy||self||!changed}
                onClick={()=>void save(account.id)}>Enregistrer</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </section>
    {message&&<p role="status" className="alert alert-info">{message}</p>}
  </div>;
}
