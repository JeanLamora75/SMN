"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Proposal={startOn:string;endOn:string;startAt:string;endAt:string;name:string;timeZone:string};
type Response={first:boolean;nextNumber:number;recommended:string|null;proposal:Proposal|null};
export default function SprintForm(){
 const t=useTranslation();
 const [startOn,setStartOn]=useState("");
 const [name,setName]=useState("");
 const [custom,setCustom]=useState(false);
 const [proposal,setProposal]=useState<Proposal|null>(null);
 const [number,setNumber]=useState(1);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [created,setCreated]=useState("");
 useUnsavedChanges(!!startOn&&!created,t("draft.leaveWarning"));
 useEffect(()=>{let active=true;const load=async()=>{
 try{
  const url="/api/admin/sprints"+(startOn?"?startOn="+encodeURIComponent(startOn):"");
  const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error();
  const d=await r.json() as Response;
  if(!active)return;
  setNumber(d.nextNumber);
  if(!startOn&&d.recommended){setStartOn(d.recommended);return;}
  setProposal(d.proposal);
  if(d.proposal&&!custom)setName(d.proposal.name);
 }catch{if(active){setProposal(null);setError(t("sprintCreate.invalid"));}}
 };void load();return()=>{active=false;};},[startOn,custom,t]);
 async function submit(e:FormEvent){e.preventDefault();if(!proposal)return;setBusy(true);setError("");setCreated("");
 try{
  const r=await fetch("/api/admin/sprints",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({startOn,name})});
  const d=await r.json();
  if(!r.ok){setError(t(d.error==="overlap"?"sprintCreate.overlap":"sprintCreate.invalid"));return;}
  setCreated(d.sprint.name);setProposal(null);setStartOn("");
 }catch{setError(t("sprintCreate.invalid"));}finally{setBusy(false);}
 }
 return <section className="smn-panel p-4 d-grid gap-3">
 <h1 className="h3">{t("sprintCreate.title")}</h1>
 <p className="text-secondary">{t("sprintCreate.intro")}</p>
 <form className="d-grid gap-3" onSubmit={submit}>
  <label htmlFor="sprint-start">{t("sprintCreate.start")}</label>
  <input id="sprint-start" type="date" className="form-control" required value={startOn} disabled={busy} onChange={e=>{setStartOn(e.target.value);setCreated("");setError("");}}/>
  <label htmlFor="sprint-name">{t("sprintCreate.name")}</label>
  <input id="sprint-name" className="form-control" required maxLength={160} value={name} disabled={busy} onChange={e=>{setName(e.target.value);setCustom(true);}}/>
  <p className="small text-secondary">{t("sprintCreate.number",{number})}</p>
  {proposal&&<p className="small">{t("sprintCreate.dates",{start:proposal.startOn,end:proposal.endOn,zone:proposal.timeZone})}</p>}
  <button type="submit" className="btn btn-primary" disabled={!proposal||busy}>{t("sprintCreate.generate")}</button>
 </form>
 {error&&<p role="alert" className="alert alert-warning">{error}</p>}
 {created&&<p role="status" className="alert alert-success">{t("sprintCreate.created",{name:created})}</p>}
 </section>;
}
