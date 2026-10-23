"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {criticality,levels,type Level} from "@/lib/risk-criticality";
type Assessment={probability:Level|null;impact:Level|null;revision:number};
export default function RiskAssessment({id,canManage}:{id:string;canManage:boolean}){
 const t=useTranslation();const tr=(x:string)=>t(("registryAssessment."+x) as Parameters<typeof t>[0]);
 const [stored,setStored]=useState<Assessment|null>(null);
 const [p,setP]=useState<Level|null>(null);const [i,setI]=useState<Level|null>(null);
 const [saving,setSaving]=useState(false);const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState(false);
 useEffect(()=>{
  const ctrl=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"/assessment",{signal:ctrl.signal,cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("missing");return r.json() as Promise<Assessment>;})
   .then(data=>{if(!ctrl.signal.aborted){setStored(data);setP(data.probability);setI(data.impact);}})
   .catch(()=>{if(!ctrl.signal.aborted)setError("error");});
  return()=>ctrl.abort();
 },[id]);
 const result=criticality(p,i),dirty=!!stored&&(stored.probability!==p||stored.impact!==i);
 const save=async()=>{
  if(!canManage||!stored||saving)return;setSaving(true);setError(null);setNotice(false);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/assessment",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({probability:p,impact:i,revision:stored.revision})});
   if(response.status===409){setError("conflict");return;}
   if(!response.ok)throw Error("save-failed");
   const data=await response.json() as {ok:boolean;revision:number};
   if(!data.ok)throw Error("save-failed");
   setStored({probability:p,impact:i,revision:data.revision});setNotice(true);
  }catch{setError("error");}finally{setSaving(false);}
 };
 const pick=(value:string)=>value===""?null:Number(value) as Level;
 return <section className="card p-3 mt-3">
  <h2 className="h5">{tr("heading")}</h2>
  {!stored?<p role="status">{tr(error??"error")}</p>:<>
   <div className="row g-3">
    {([{field:"probability",value:p,set:setP},{field:"impact",value:i,set:setI}] as const).map(x=>
     <div key={x.field} className="col-md-6">
      <label className="form-label" htmlFor={"risk-"+x.field}>{tr(x.field)}</label>
      <select id={"risk-"+x.field} className="form-select" disabled={!canManage} value={x.value??""}
       onChange={e=>{x.set(pick(e.target.value));setNotice(false);}}>
       <option value="">{tr("none")}</option>
       {levels.map(level=><option value={level} key={level}>{tr(level===1?"low":level===2?"medium":"high")}</option>)}
      </select>
     </div>)}
   </div>
   <p className="mt-3" role="status"><span aria-hidden="true">{result.level==="high"?"▲":result.level==="medium"?"◆":result.level==="low"?"●":"?"} </span>
    {tr("symbol")}: <strong>{tr(result.level)}</strong> {result.score!==null&&<>({tr("score")}: {result.score})</>}
    {dirty&&<span className="d-block text-warning-emphasis">{tr("provisional")}</span>}
   </p>
   {canManage&&<button className="btn btn-primary align-self-start" type="button" disabled={!dirty||saving} onClick={save}>{tr(saving?"saving":"save")}</button>}
   {notice&&<p role="status" className="text-success">{tr("updated")}</p>}
   {error&&<p role="alert" className="text-danger">{tr(error)}</p>}
  </>}
 </section>;
}
