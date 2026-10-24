"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Info={rationale:string|null;replacesId:string|null;revision:number;replacedBy:{id:string;title:string}[]};
export default function DecisionDetail({id,canManage,onSaved}:{id:string;canManage:boolean;onSaved?:()=>void}){
 const t=useTranslation(),tr=(key:string)=>t(("decisionDetail."+key) as Parameters<typeof t>[0]);
 const [info,setInfo]=useState<Info|null>(null),[rationale,setRationale]=useState("");
 const [replaces,setReplaces]=useState(""),[error,setError]=useState(""),[success,setSuccess]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const ctl=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/decision",{signal:ctl.signal,cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Info>;})
   .then(d=>{if(!ctl.signal.aborted){setInfo(d);setRationale(d.rationale??"");setReplaces(d.replacesId??"");}})
   .catch(()=>{if(!ctl.signal.aborted)setError("error");});
  return()=>ctl.abort();
 },[id]);
 const save=async()=>{
  if(!canManage||!info||busy)return;setBusy(true);setError("");setSuccess(false);
  try{
   const r=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/decision",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({rationale:rationale||null,replacesId:replaces.trim()||null,revision:info.revision})});
   if(r.status===409){setError("conflict");return;}
   if(!r.ok)throw Error("failed");
   const result=await r.json() as {ok:boolean;revision:number};
   if(!result.ok)throw Error("failed");
   setInfo({...info,rationale:rationale||null,replacesId:replaces.trim()||null,revision:result.revision});
   setSuccess(true);onSaved?.();
  }catch{setError("error");}finally{setBusy(false);}
 };
 return <section className="card p-3 mt-3">
  <h2 className="h5">{tr("heading")}</h2>
  {!info?<p role="status">{error?tr(error):"…"}</p>:<>
   <label className="form-label" htmlFor="decision-rationale">{tr("rationale")}</label>
   {canManage?<textarea className="form-control" id="decision-rationale" maxLength={4000} rows={3}
    value={rationale} onChange={e=>{setRationale(e.target.value);setSuccess(false);}}/>:<p>{rationale||"—"}</p>}
   <label className="form-label mt-3" htmlFor="decision-replaces">{tr("replaces")}</label>
   {canManage?<input className="form-control" id="decision-replaces" maxLength={36} value={replaces}
    onChange={e=>{setReplaces(e.target.value);setSuccess(false);}}/>:
    <p>{info.replacesId?<Link href={"/app/admin/registries/"+encodeURIComponent(info.replacesId)}>{info.replacesId}</Link>:tr("noReplacement")}</p>}
   {canManage&&<p className="small text-body-secondary">{tr("help")}</p>}
   {info.replacesId&&canManage&&<p><Link href={"/app/admin/registries/"+encodeURIComponent(info.replacesId)}>{tr("replaces")}: {info.replacesId}</Link></p>}
   <h3 className="h6 mt-3">{tr("inverse")}</h3>
   {info.replacedBy.length?<ul>{info.replacedBy.map(d=><li key={d.id}><Link href={"/app/admin/registries/"+encodeURIComponent(d.id)}>{d.title}</Link></li>)}</ul>:<p>{tr("noReplacement")}</p>}
   {canManage&&<button type="button" className="btn btn-primary align-self-start" disabled={busy} onClick={save}>{tr("save")}</button>}
   {success&&<p role="status" className="text-success">{tr("saved")}</p>}
   {error&&<p role="alert" className="text-danger">{tr(error)}</p>}
  </>}
 </section>;
}
