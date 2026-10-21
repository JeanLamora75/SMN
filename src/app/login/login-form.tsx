"use client";
import {useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
export default function LoginForm(){
  const t=useTranslation();
  const [identity,setIdentity]=useState("admin");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<""|"tooMany"|"unavailable"|"incorrect"|"network">("");
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");
    try{
      const response=await fetch("/api/auth/login",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({identity,password}),cache:"no-store",
      });
      const result=await response.json() as {ok?:boolean;error?:string;mustChangePassword?:boolean};
      if(result.ok){
        window.location.assign(result.mustChangePassword?"/change-password":"/app");
        return;
      }
      setError(result.error==="too-many-attempts"?"tooMany":
        result.error==="service-unavailable"?"unavailable":"incorrect");
    }catch{setError("network");}
    finally{setBusy(false);}
  }
  return <form onSubmit={submit} className="d-grid gap-3" aria-describedby={error?"login-feedback":undefined}>
    <label className="form-label">{t("login.identity")}
      <input id="login-identity" className="form-control" required autoComplete="username" aria-invalid={!!error} aria-describedby={error?"login-feedback":undefined} maxLength={200}
        value={identity} onChange={e=>setIdentity(e.target.value)} disabled={busy}/>
    </label>
    <label className="form-label">{t("login.password")}
      <input id="login-password" className="form-control" required type="password" aria-invalid={!!error} aria-describedby={error?"login-feedback":undefined} autoComplete="current-password"
        value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/>
    </label>
    <button className="btn btn-primary" type="submit" disabled={busy}>
      {t(busy?"login.busy":"login.submit")}
    </button>
    {error&&<p id="login-feedback" role="alert" className="alert alert-warning mb-0">{t(`login.${error}` as Parameters<typeof t>[0])}</p>}
    <p className="small text-secondary mb-0">{t("login.pilotInfo")}</p>
  </form>;
}
