"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
import {reconcileAccountEdits,editedAccount} from "@/lib/account-drafts";

type Role = "admin" | "user";
type Account = {
  id:string;username:string;email:string;role:Role;
  is_active:boolean;must_change_password:boolean;
};
type Status = "loading"|"ready"|"error";

export default function UsersAdmin({selfId}:{selfId:string}) {
  const t=useTranslation();
  const errorMessage=(code:string|undefined,fallback:"createFailed"|"updateFailed")=>{
    const known=["duplicate-account","invalid-input","last-admin","self-protected","account-not-found","forbidden","service-unavailable"];
    return t(known.includes(code??"")?`accounts.errors.${code}` as Parameters<typeof t>[0]:`accounts.${fallback}`);
  };
  const [accounts,setAccounts]=useState<Account[]>([]);
  const accountsRef=useRef<Account[]>([]);
  const [status,setStatus]=useState<Status>("loading");
  const [message,setMessage]=useState("");
  const [messageError,setMessageError]=useState(false);
  const [busy,setBusy]=useState(false);
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [role,setRole]=useState<Role>("user");
  const [edits,setEdits]=useState<Record<string,{role:Role;isActive:boolean}>>({});
  const refresh=useCallback(async(savedId?:string,preserveDrafts=true):Promise<boolean>=>{
    try {
      const response=await fetch("/api/admin/accounts",{cache:"no-store"});
      if (!response.ok) throw new Error("fetch-error");
      const data=await response.json() as {accounts:Account[]};
      const previous=accountsRef.current;
      setEdits(drafts=>preserveDrafts
        ? reconcileAccountEdits(previous,drafts,data.accounts,savedId)
        : reconcileAccountEdits([],{},data.accounts));
      accountsRef.current=data.accounts;
      setAccounts(data.accounts);
      setStatus("ready");
      return true;
    } catch {setStatus(current=>current==="ready"?"ready":"error");setMessageError(true);setMessage(t("accounts.loadFailed"));return false;}
  },[t]);
  useEffect(()=>{void Promise.resolve().then(refresh);},[refresh]);
  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessageError(false);setMessage("");
    try {
      const response=await fetch("/api/admin/accounts",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,email,password,role})});
      const data=await response.json() as {error?:string};
      if (!response.ok) {setMessageError(true);setMessage(errorMessage(data.error,"createFailed"));return;}
      setUsername("");setEmail("");setPassword("");setRole("user");
      if(await refresh())setMessage(t("accounts.created"));
    } catch {setMessageError(true);setMessage(t("accounts.server"));}
    finally {setBusy(false);}
  }
  async function save(id:string) {
    const edit=edits[id];if (!edit) return;
    setBusy(true);setMessageError(false);setMessage("");
    try {
      const response=await fetch("/api/admin/accounts/"+encodeURIComponent(id),{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({role:edit.role,isActive:edit.isActive})});
      const data=await response.json() as {error?:string};
      if (!response.ok) {setMessageError(true);setMessage(errorMessage(data.error,"updateFailed"));return;}
      if(await refresh(id))setMessage(t("accounts.updated"));
    } catch {setMessageError(true);setMessage(t("accounts.server"));}
    finally {setBusy(false);}
  }
  const dirtyCreation=!!(username||email||password||role!=="user");
  const dirtyAccounts=accounts.some(account=>editedAccount(account,edits[account.id]));
  const dirty=dirtyCreation||dirtyAccounts;
  useUnsavedChanges(dirty||busy,t("draft.leaveWarning"));
  const discardAndReload=()=>{
    if(dirty&&!window.confirm(t("draft.discardWarning")))return;
    setMessage("");setMessageError(false);
    void refresh(undefined,false);
  };
  return <div className="d-grid gap-4">
    {dirty&&<p role="status" className="alert alert-warning mb-0">{t("draft.pending")}</p>}
    <section className="smn-panel p-4">
      <h2 className="h5">{t("accounts.createTitle")}</h2>
      <p className="small text-secondary">{t("accounts.createInfo")}</p>
      {dirtyCreation&&<p className="small fw-semibold">{t("draft.provisional")}</p>}
      <form onSubmit={create} className="row g-3" aria-describedby={message?"accounts-feedback":undefined}>
        <div className="col-md-6"><label className="form-label">{t("accounts.username")}<input className="form-control" required minLength={2} maxLength={50}
            value={username} onChange={e=>setUsername(e.target.value)} disabled={busy} autoComplete="off"/>
        </label></div>
        <div className="col-md-6"><label className="form-label">{t("accounts.email")}<input className="form-control" type="email" required maxLength={200}
            value={email} onChange={e=>setEmail(e.target.value)} disabled={busy} autoComplete="off"/>
        </label></div>
        <div className="col-md-6"><label className="form-label">{t("accounts.initialPassword")}<input className="form-control" type="password" required minLength={4} maxLength={256}
            value={password} onChange={e=>setPassword(e.target.value)} disabled={busy} autoComplete="new-password"/>
        </label></div>
        <div className="col-md-6"><label className="form-label">{t("accounts.roleCol")}<select className="form-select" value={role} onChange={e=>setRole(e.target.value as Role)} disabled={busy}>
            <option value="user">{t("accounts.userCol")}</option><option value="admin">{t("accounts.admin")}</option>
          </select>
        </label></div>
        <div><button className="btn btn-primary" type="submit" disabled={busy}>
          {t(busy?"accounts.saving":"accounts.create")}
        </button></div>
      </form>
    </section>
    <section className="smn-panel p-4">
      <h2 className="h5">{t("accounts.existing")}</h2>
      {status==="loading"&&<p>{t("accounts.loading")}</p>}
      {status==="error"&&<button className="btn btn-outline-secondary" onClick={discardAndReload}>{t("accounts.retry")}</button>}
      {status==="ready"&&<div className="table-responsive smn-accounts-responsive">
        <table role="table" aria-label={t("accounts.existing")} className="table align-middle smn-accounts-table">
          <thead role="rowgroup"><tr role="row"><th scope="col">{t("accounts.userCol")}</th><th scope="col">{t("accounts.emailCol")}</th><th scope="col">{t("accounts.roleCol")}</th><th scope="col">{t("accounts.accessCol")}</th><th scope="col">{t("accounts.actionCol")}</th></tr></thead>
          <tbody role="rowgroup">{accounts.map(account=>{
            const edit=edits[account.id]??{role:account.role,isActive:account.is_active};
            const self=account.id===selfId;
            const changed=edit.role!==account.role||edit.isActive!==account.is_active;
            return <tr role="row" key={account.id}>
              <td role="cell" data-label={t("accounts.userCol")}><strong>{account.username}</strong>{self?t("accounts.you"):""}
                {account.must_change_password&&<div className="small text-secondary">{t("accounts.changeInitial")}</div>}</td>
              <td role="cell" data-label={t("accounts.emailCol")}>{account.email}</td>
              <td role="cell" data-label={t("accounts.roleCol")}><select aria-label={t("accounts.roleFor",{username:account.username})} className="form-select form-select-sm"
                value={edit.role} disabled={busy||self} onChange={e=>
                  setEdits(prev=>({...prev,[account.id]:{...edit,role:e.target.value as Role}}))}>
                <option value="user">{t("accounts.userCol")}</option><option value="admin">{t("accounts.admin")}</option>
              </select></td>
              <td role="cell" data-label={t("accounts.accessCol")}><select aria-label={t("accounts.accessFor",{username:account.username})} className="form-select form-select-sm"
                value={edit.isActive?"active":"inactive"} disabled={busy||self} onChange={e=>
                  setEdits(prev=>({...prev,[account.id]:{...edit,isActive:e.target.value==="active"}}))}>
                <option value="active">{t("accounts.active")}</option><option value="inactive">{t("accounts.inactive")}</option>
              </select></td>
              <td role="cell" data-label={t("accounts.actionCol")}><button className="btn btn-outline-primary btn-sm" disabled={busy||self||!changed}
                onClick={()=>void save(account.id)}>{t("accounts.save")}</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </section>
    {message&&<p id="accounts-feedback" role={messageError?"alert":"status"} className={"alert "+(messageError?"alert-warning":"alert-info")}>{message}</p>}
  </div>;
}
