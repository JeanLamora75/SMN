"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Party={kind:"local";teamId:string}|{kind:"external";name:string};
type Data={teamId:string;teamName:string;requester:Party|null;contributor:Party|null;revision:number};
export default function DependencyParties({id,canManage}:{id:string;canManage:boolean}){
 const t=useTranslation();const tr=(k:string)=>t(("dependencyParties."+k) as Parameters<typeof t>[0]);
 const [data,setData]=useState<Data|null>(null);
 const [requester,setRequester]=useState<Party|null>(null),[contributor,setContributor]=useState<Party|null>(null);
 const [error,setError]=useState(""),[success,setSuccess]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const ctl=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/parties",{cache:"no-store",signal:ctl.signal})
   .then(async r=>{if(!r.ok)throw Error("invalid");return r.json() as Promise<Data>;})
   .then(v=>{if(!ctl.signal.aborted){setData(v);setRequester(v.requester);setContributor(v.contributor);}})
   .catch(()=>{if(!ctl.signal.aborted)setError("error");});
  return()=>ctl.abort();
 },[id]);
 const render=(field:"requester"|"contributor",value:Party|null,assign:(p:Party)=>void)=>{
  const local=data?{kind:"local" as const,teamId:data.teamId}:null;
  return <div className="col-md-6">
   <label className="form-label" htmlFor={"dependency-"+field}>{tr(field)}</label>
   {canManage?<><select className="form-select" id={"dependency-"+field}
    value={value?.kind??""} onChange={e=>{assign(e.target.value==="local"?local!: {kind:"external",name:""});setSuccess(false);}}>
    <option value="" disabled>{tr("empty")}</option>
    <option value="local">{tr("local")}{data?" — "+data.teamName:""}</option>
    <option value="external">{tr("external")}</option>
   </select>
   {value?.kind==="external"&&<><label className="form-label mt-2" htmlFor={"dependency-"+field+"-name"}>{tr("name")}</label>
    <input className="form-control" id={"dependency-"+field+"-name"} maxLength={120} required value={value.name}
     onChange={e=>assign({kind:"external",name:e.target.value})}/></>}</>:
    <p>{value?.kind==="local"?data?.teamName:value?.kind==="external"?value.name:tr("empty")}</p>}
  </div>;
 };
 const valid=(p:Party|null)=>!!p&&(p.kind==="local"||!!p.name.trim());
 const save=async()=>{
  if(!data||!valid(requester)||!valid(contributor)||busy)return;
  setBusy(true);setError("");setSuccess(false);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/parties",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({requester,contributor,revision:data.revision})});
   if(response.status===409){setError("conflict");return;}
   if(!response.ok)throw Error("invalid");
   const result=await response.json() as {ok:boolean;revision:number};
   if(!result.ok)throw Error("invalid");
   setData({...data,requester,contributor,revision:result.revision});setSuccess(true);
  }catch{setError("error");}finally{setBusy(false);}
 };
 return <section className="card p-3 mt-3"><h2 className="h5">{tr("heading")}</h2>
  {!data?<p role="status">{error?tr(error):"…"}</p>:<>
   <div className="row g-3">{render("requester",requester,setRequester)}{render("contributor",contributor,setContributor)}</div>
   {canManage&&<button type="button" className="btn btn-primary align-self-start mt-3"
    disabled={busy||!valid(requester)||!valid(contributor)} onClick={save}>{tr("save")}</button>}
   {error&&<p role="alert" className="text-danger">{tr(error)}</p>}
   {success&&<p role="status" className="text-success">{tr("saved")}</p>}
  </>}
 </section>;
}
