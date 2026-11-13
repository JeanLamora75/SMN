"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {useTranslation} from "@/i18n/client";
import {createPortal} from "react-dom";
import {OPEN_ACCOUNT_CREATE} from "./create-account-button";
import {filterSettingsUsers} from "@/lib/settings-collection-filter";
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
  const [editor,setEditor]=useState<null|{mode:"create"}|{mode:"edit";id:string}>(null);
  const [mounted,setMounted]=useState(false);
  const dialogRef=useRef<HTMLDialogElement>(null);
  const openerRef=useRef<HTMLElement|null>(null);
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [role,setRole]=useState<Role>("user");
  const [edits,setEdits]=useState<Record<string,{role:Role;isActive:boolean}>>({});
  const [query,setQuery]=useState("");
  const [statusFilter,setStatusFilter]=useState<"all"|"active"|"inactive">("all");
  const [roleFilter,setRoleFilter]=useState<"all"|Role>("all");
  const displayed=useMemo(()=>filterSettingsUsers(accounts,query,statusFilter,roleFilter),[accounts,query,statusFilter,roleFilter]);
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
  useEffect(()=>{void Promise.resolve().then(()=>refresh());},[refresh]);
  async function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessageError(false);setMessage("");
    try {
      const response=await fetch("/api/admin/accounts",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,email,password,role})});
      const data=await response.json() as {error?:string};
      if (!response.ok) {setMessageError(true);setMessage(errorMessage(data.error,"createFailed"));return;}
      setUsername("");setEmail("");setPassword("");setRole("user");
      if(await refresh()){setMessage(t("accounts.created"));setEditor(null);}
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
      if(await refresh(id)){setMessage(t("accounts.updated"));setEditor(null);}
    } catch {setMessageError(true);setMessage(t("accounts.server"));}
    finally {setBusy(false);}
  }
  const dirtyCreation=editor?.mode==="create"&&!!(username||email||password||role!=="user");
  const dirtyAccounts=editor?.mode==="edit"&&accounts.some(account=>editedAccount(account,edits[account.id]));
  const dirty=dirtyCreation||dirtyAccounts;
  useUnsavedChanges((!!editor&&dirty)||busy,t("draft.leaveWarning"));
  function openCreate(){
    if(busy)return;
    if(editor&&dirty&&!window.confirm(t("draft.discardWarning")))return;
    openerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    setUsername("");setEmail("");setPassword("");setRole("user");
    setMessage("");setMessageError(false);setEditor({mode:"create"});
  }
  function openEdit(account:Account){
    if(busy)return;
    if(editor&&dirty&&!window.confirm(t("draft.discardWarning")))return;
    openerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    setEdits(old=>({...old,[account.id]:{role:account.role,isActive:account.is_active}}));
    setMessage("");setMessageError(false);setEditor({mode:"edit",id:account.id});
  }
  function closeEditor(){
    if(busy)return;
    if(dirty&&!window.confirm(t("draft.discardWarning")))return;
    setEditor(null);setUsername("");setEmail("");setPassword("");setRole("user");
    setMessage("");setMessageError(false);
  }
  useEffect(()=>{setMounted(true);},[]);
  useEffect(()=>{
    window.addEventListener(OPEN_ACCOUNT_CREATE,openCreate);
    return()=>window.removeEventListener(OPEN_ACCOUNT_CREATE,openCreate);
  });
  useEffect(()=>{
    if(!editor||!mounted)return;
    const dialog=dialogRef.current;if(!dialog)return;
    if(!dialog.open)dialog.showModal();
    dialog.querySelector<HTMLInputElement>(editor.mode==="create"?"#account-create-username":"#account-edit-role")?.focus();
    return()=>{if(dialog.open)dialog.close();openerRef.current?.focus();};
  },[editor,mounted]);
  const discardAndReload=()=>{
    if(dirty&&!window.confirm(t("draft.discardWarning")))return;
    setMessage("");setMessageError(false);
    void refresh(undefined,false);
  };
  const selected=editor?.mode==="edit"?accounts.find(a=>a.id===editor.id):null;
  const selectedEdit=selected?(edits[selected.id]??{role:selected.role,isActive:selected.is_active}):null;
  const selectedChanged=!!selected&&!!selectedEdit&&editedAccount(selected,selectedEdit);
  return <div className="d-grid gap-4">
    <section className="smn-panel p-4">
      <h2 className="h5">{t("accounts.existing")}</h2>
      <div className="d-flex flex-wrap gap-3 align-items-end mb-3">
        <label className="form-label mb-0 flex-grow-1" style={{minWidth:190,maxWidth:360}}>{t("settingsCollections.searchUsers")}
          <input type="search" className="form-control mt-1" value={query} onChange={event=>setQuery(event.target.value)} />
        </label>
        <label className="form-label mb-0" style={{minWidth:150}}>{t("settingsCollections.filterStatus")}
          <select className="form-select mt-1" value={statusFilter} onChange={event=>setStatusFilter(event.target.value as "all"|"active"|"inactive")}>
            <option value="all">{t("settingsCollections.all")}</option><option value="active">{t("settingsCollections.active")}</option><option value="inactive">{t("settingsCollections.inactive")}</option>
          </select>
        </label>
        <label className="form-label mb-0" style={{minWidth:140}}>{t("settingsCollections.filterRole")}
          <select className="form-select mt-1" value={roleFilter} onChange={event=>setRoleFilter(event.target.value as "all"|Role)}>
            <option value="all">{t("settingsCollections.allRoles")}</option><option value="user">{t("accounts.userCol")}</option><option value="admin">{t("accounts.admin")}</option>
          </select>
        </label>
        <button type="button" className="btn btn-outline-secondary" onClick={()=>{setQuery("");setStatusFilter("all");setRoleFilter("all");}} disabled={!query&&statusFilter==="all"&&roleFilter==="all"}>{t("settingsCollections.reset")}</button>
      </div>
      {status==="ready"&&<p role="status" aria-live="polite" className="small text-secondary">{t("settingsCollections.results",{count:displayed.length,total:accounts.length})}</p>}
      {status==="ready"&&displayed.length===0&&<p role="status" className="small text-secondary">{t("settingsCollections.noMatches")}</p>}
      {status==="loading"&&<p>{t("accounts.loading")}</p>}
      {status==="error"&&<button className="btn btn-outline-secondary" onClick={discardAndReload}>{t("accounts.retry")}</button>}
      {status==="ready"&&<div className="table-responsive smn-accounts-responsive">
        <table role="table" aria-label={t("accounts.existing")} className="table align-middle smn-accounts-table">
          <thead role="rowgroup"><tr role="row"><th scope="col">{t("accounts.userCol")}</th><th scope="col">{t("accounts.emailCol")}</th><th scope="col">{t("accounts.roleCol")}</th><th scope="col">{t("accounts.accessCol")}</th><th scope="col">{t("accounts.actionCol")}</th></tr></thead>
          <tbody role="rowgroup">{displayed.map(account=>{
            const self=account.id===selfId;
            return <tr role="row" key={account.id}>
              <td role="cell" data-label={t("accounts.userCol")}><strong>{account.username}</strong>{self?t("accounts.you"):""}
                {account.must_change_password&&<div className="small text-secondary">{t("accounts.changeInitial")}</div>}</td>
              <td role="cell" data-label={t("accounts.emailCol")}>{account.email}</td>
              <td role="cell" data-label={t("accounts.roleCol")}>{t(account.role==="admin"?"accounts.admin":"accounts.userCol")}</td>
              <td role="cell" data-label={t("accounts.accessCol")}>{t(account.is_active?"accounts.active":"accounts.inactive")}</td>
              <td role="cell" data-label={t("accounts.actionCol")}>
               <button type="button" className="btn btn-sm btn-outline-primary smn-account-icon-action"
                 aria-label={t("accounts.editAccount")+": "+account.username} title={t("accounts.editAccount")}
                 disabled={busy||self} onClick={()=>openEdit(account)}>
                 <i className="bi bi-pencil-square" aria-hidden="true"/>
               </button>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </section>
    {mounted&&editor&&createPortal(<dialog ref={dialogRef} className="smn-account-editor-dialog"
     aria-labelledby="smn-account-editor-title"
     onCancel={event=>{event.preventDefault();closeEditor();}}>
      <div className="smn-account-editor-modal">
       <header className="smn-account-editor-header">
        <div className="smn-account-editor-identity">
         <span className="smn-account-editor-symbol" aria-hidden="true"><i className="bi bi-people"/></span>
         <div><span className="smn-account-editor-eyebrow">COCKPIT AGILE</span>
          <h2 id="smn-account-editor-title" className="h5 mb-0">{t(editor.mode==="create"?"accounts.createTitle":"accounts.editAccount")}</h2>
         </div>
        </div>
        <button className="btn-close" type="button" disabled={busy} aria-label={t("accounts.cancel")} onClick={closeEditor}/>
       </header>
       {editor.mode==="create"?<form id="smn-account-form" onSubmit={create}>
        <div className="smn-account-editor-body">
         <p className="small text-secondary">{t("accounts.createInfo")}</p>
         {dirtyCreation&&<p role="status" className="small fw-semibold">{t("draft.provisional")}</p>}
         {message&&messageError&&<p role="alert" className="alert alert-warning">{message}</p>}
         <div className="row g-3">
          <div className="col-md-6"><label className="form-label" htmlFor="account-create-username">{t("accounts.username")}</label>
           <input id="account-create-username" className="form-control" required minLength={2} maxLength={50} autoComplete="off"
            value={username} onChange={e=>{setUsername(e.target.value);setMessage("");}} disabled={busy}/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="account-create-email">{t("accounts.email")}</label>
           <input id="account-create-email" className="form-control" type="email" required maxLength={200} autoComplete="off"
            value={email} onChange={e=>{setEmail(e.target.value);setMessage("");}} disabled={busy}/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="account-create-password">{t("accounts.initialPassword")}</label>
           <input id="account-create-password" className="form-control" type="password" required minLength={4} maxLength={256}
            autoComplete="new-password" value={password} onChange={e=>{setPassword(e.target.value);setMessage("");}} disabled={busy}/></div>
          <div className="col-md-6"><label className="form-label" htmlFor="account-create-role">{t("accounts.roleCol")}</label>
           <select id="account-create-role" className="form-select" value={role} onChange={e=>{setRole(e.target.value as Role);setMessage("");}} disabled={busy}>
            <option value="user">{t("accounts.userCol")}</option><option value="admin">{t("accounts.admin")}</option>
           </select></div>
         </div>
        </div>
        <footer className="smn-account-editor-footer d-flex justify-content-end gap-2">
         <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={closeEditor}>{t("accounts.cancel")}</button>
         <button type="submit" className="btn btn-primary smn-account-icon-action" disabled={busy}
          title={t("accounts.save")} aria-label={t("accounts.save")}>
          <i className="bi bi-floppy" aria-hidden="true"/>
         </button>
        </footer>
       </form>:selected&&selectedEdit&&<form id="smn-account-edit-form" onSubmit={event=>{event.preventDefault();void save(selected.id);}}>
        <div className="smn-account-editor-body">
         <p className="fw-semibold mb-2">{selected.username} — {selected.email}</p>
         {message&&messageError&&<p role="alert" className="alert alert-warning">{message}</p>}
         <div className="row g-3">
          <div className="col-md-6">
           <label htmlFor="account-edit-role" className="form-label">{t("accounts.roleCol")}</label>
           <select id="account-edit-role" className="form-select" disabled={busy} value={selectedEdit.role}
            onChange={e=>setEdits(prev=>({...prev,[selected.id]:{...selectedEdit,role:e.target.value as Role}}))}>
            <option value="user">{t("accounts.userCol")}</option><option value="admin">{t("accounts.admin")}</option>
           </select>
          </div>
          <div className="col-md-6">
           <label htmlFor="account-edit-access" className="form-label">{t("accounts.accessCol")}</label>
           <select id="account-edit-access" className="form-select" disabled={busy}
            value={selectedEdit.isActive?"active":"inactive"}
            onChange={e=>setEdits(prev=>({...prev,[selected.id]:{...selectedEdit,isActive:e.target.value==="active"}}))}>
            <option value="active">{t("accounts.active")}</option>
            <option value="inactive">{t("accounts.inactive")}</option>
           </select>
          </div>
         </div>
        </div>
        <footer className="smn-account-editor-footer d-flex justify-content-end gap-2">
         <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={closeEditor}>{t("accounts.cancel")}</button>
         <button type="submit" className="btn btn-primary smn-account-icon-action" disabled={busy||!selectedChanged}
          title={t("accounts.save")} aria-label={t("accounts.save")}>
          <i className="bi bi-floppy" aria-hidden="true"/>
         </button>
        </footer>
       </form>}
      </div>
     </dialog>,document.body)}
    {message&&!editor&&<p id="accounts-feedback" role={messageError?"alert":"status"} className={"alert "+(messageError?"alert-warning":"alert-info")}>{message}</p>}
  </div>;
}
