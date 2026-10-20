"use client";
import { useState, type FormEvent } from "react";
export default function SecurityForm() {
  const [current,setCurrent]=useState("");
  const [phrase,setPhrase]=useState("");
  const [confirm,setConfirm]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phrase !== confirm || phrase === current) {setMessage("La confirmation est incorrecte ou les valeurs sont identiques.");return;}
    setBusy(true);
    try {
      const response=await fetch("/api/auth/recovery-phrase",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({currentPassword:current,recoveryPhrase:phrase}),cache:"no-store",
      });
      setMessage(response.ok?"Phrase de secours enregistrée : conservez-la dans un lieu sûr.":
        "Préparation refusée. Vérifiez votre mot de passe et la phrase.");
      if(response.ok){setCurrent("");setPhrase("");setConfirm("");}
    }catch{setMessage("SMN ne répond pas. Aucune confirmation reçue.");}
    finally{setBusy(false);}
  }
  return <form onSubmit={submit} className="d-grid gap-3">
    <label>Mot de passe actuel
      <input type="password" className="form-control" autoComplete="current-password" value={current}
        onChange={e=>setCurrent(e.target.value)} required disabled={busy}/>
    </label>
    <label>Nouvelle phrase de secours
      <input type="password" className="form-control" minLength={20} maxLength={256} value={phrase}
        onChange={e=>setPhrase(e.target.value)} required disabled={busy}/>
    </label>
    <label>Confirmation de la phrase
      <input type="password" className="form-control" minLength={20} maxLength={256} value={confirm}
        onChange={e=>setConfirm(e.target.value)} required disabled={busy}/>
    </label>
    <button type="submit" className="btn btn-primary" disabled={busy}>Préparer la récupération</button>
    {message&&<p role="status" className="alert alert-info">{message}</p>}
  </form>;
}
