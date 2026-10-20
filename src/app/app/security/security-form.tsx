"use client";
import { useState, type FormEvent } from "react";
import {useTranslation} from "@/i18n/client";
export default function SecurityForm() {
  const t=useTranslation();
  const [current,setCurrent]=useState("");
  const [phrase,setPhrase]=useState("");
  const [confirm,setConfirm]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phrase !== confirm || phrase === current) {setMessage(t("security.mismatch"));return;}
    setBusy(true);
    try {
      const response=await fetch("/api/auth/recovery-phrase",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({currentPassword:current,recoveryPhrase:phrase}),cache:"no-store",
      });
      setMessage(t(response.ok?"security.saved":"security.rejected"));
      if(response.ok){setCurrent("");setPhrase("");setConfirm("");}
    }catch{setMessage(t("security.network"));}
    finally{setBusy(false);}
  }
  return <form onSubmit={submit} className="d-grid gap-3">
    <label>{t("security.current")}
      <input type="password" className="form-control" autoComplete="current-password" value={current}
        onChange={e=>setCurrent(e.target.value)} required disabled={busy}/>
    </label>
    <label>{t("security.phrase")}
      <input type="password" className="form-control" minLength={20} maxLength={256} value={phrase}
        onChange={e=>setPhrase(e.target.value)} required disabled={busy}/>
    </label>
    <label>{t("security.confirmation")}
      <input type="password" className="form-control" minLength={20} maxLength={256} value={confirm}
        onChange={e=>setConfirm(e.target.value)} required disabled={busy}/>
    </label>
    <button type="submit" className="btn btn-primary" disabled={busy}>{t("security.prepare")}</button>
    {message&&<p role="status" className="alert alert-info">{message}</p>}
  </form>;
}
