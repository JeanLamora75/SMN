"use client";

import { useState, type FormEvent } from "react";
import {useTranslation} from "@/i18n/client";
import fr from "@/i18n/fr.json";



export default function SetupForm() {
  const t=useTranslation();
  const translateError=(code:string|undefined)=>code && Object.prototype.hasOwnProperty.call(fr.legacySetup.errors,code)
    ?t(`legacySetup.errors.${code}` as Parameters<typeof t>[0]):t("legacySetup.error");
  const [state, setState] = useState({ mode: "scrum", product: "", team: "", password: "", setupToken: "", confirmed: false });
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.password !== passwordConfirmation) { setResult(t("legacySetup.mismatch")); return; }
    setBusy(true); setResult("");
    try {
      const response = await fetch("/api/setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state), cache: "no-store",
      });
      const message = (await response.json()) as { ok?: boolean; status?: string };
      setResult(message.ok?t("legacySetup.success"):t("legacySetup.failed",{detail:translateError(message.status)}));
      if (message.ok) {
        setState((v) => ({ ...v, password: "", setupToken: "" }));
        setPasswordConfirmation("");
      }
    } catch { setResult(t("legacySetup.network")); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="d-grid gap-3">
    <label className="form-label">{t("legacySetup.mode")}<select className="form-select" value={state.mode} onChange={(e)=>setState({...state,mode:e.target.value})}>
        <option value="scrum">Scrum</option><option value="kanban">Kanban</option>
      </select>
    </label>
    <label className="form-label">{t("legacySetup.product")}<input required maxLength={120} className="form-control" value={state.product} onChange={(e)=>setState({...state,product:e.target.value})}/>
    </label>
    <label className="form-label">{t("legacySetup.team")}<input required maxLength={120} className="form-control" value={state.team} onChange={(e)=>setState({...state,team:e.target.value})}/>
    </label>
    <p className="small text-secondary">{t("legacySetup.pilotInfo")}</p>
    <label className="form-label">{t("legacySetup.password")}<input required minLength={14} maxLength={256} type="password" autoComplete="new-password" className="form-control" value={state.password} onChange={(e)=>setState({...state,password:e.target.value})}/>
    </label>
    <label className="form-label">{t("legacySetup.confirmPassword")}<input required type="password" autoComplete="new-password" className="form-control" value={passwordConfirmation} onChange={(e)=>setPasswordConfirmation(e.target.value)}/>
    </label>
    <label className="form-label">{t("legacySetup.token")}<input required type="password" autoComplete="off" className="form-control" value={state.setupToken} onChange={(e)=>setState({...state,setupToken:e.target.value})}/>
    </label>
    <div className="form-check">
      <input className="form-check-input" id="confirm-init" type="checkbox" checked={state.confirmed} onChange={(e)=>setState({...state,confirmed:e.target.checked})}/>
      <label className="form-check-label" htmlFor="confirm-init">{t("legacySetup.confirm")}</label>
    </div>
    <button className="btn btn-primary" disabled={busy || !state.confirmed}>{t(busy?"legacySetup.working":"legacySetup.initialize")}</button>
    {result && <p role="status">{result}</p>}
  </form>;
}
