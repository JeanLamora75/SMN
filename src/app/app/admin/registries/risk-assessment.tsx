"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import {criticality,levels,type Level} from "@/lib/risk-criticality";
type Assessment={probability:Level|null;impact:Level|null;revision:number};
export default function RiskAssessment({id,canManage,onSaved}:{id:string;canManage:boolean;onSaved?:()=>void}){
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
 const result=criticality(p,i);
 const save=async(probability:Level,impact:Level)=>{
  if(!canManage||!stored||saving||stored.probability===probability&&stored.impact===impact)return;
  setSaving(true);setError(null);setNotice(false);
  try{
   const response=await fetch("/api/admin/registries/"+encodeURIComponent(id)+"/assessment",{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({probability,impact,revision:stored.revision})});
   if(response.status===409){setError("conflict");setP(stored.probability);setI(stored.impact);return;}
   if(!response.ok)throw Error("save-failed");
   const data=await response.json() as {ok:boolean;revision:number};
   if(!data.ok)throw Error("save-failed");
   setStored({probability,impact,revision:data.revision});
   setP(probability);setI(impact);setNotice(true);onSaved?.();
  }catch{setP(stored.probability);setI(stored.impact);setError("error");}
  finally{setSaving(false);}
 };
 return <section className="card p-3 mt-3">
  <h2 className="h5">{tr("heading")}</h2>
  {!stored?<p role="status">{tr(error??"error")}</p>:<>
   <div className="smn-risk-matrix" role="group" aria-label={tr("heading")}>
    <div className="smn-risk-matrix-corner"/>
    {levels.map(level=><span key={"col"+level} className="smn-risk-matrix-axis">{tr(level===1?"low":level===2?"medium":"high")}</span>)}
    {[...levels].reverse().map(impact=><div className="smn-risk-matrix-row" key={impact}>
     <span className="smn-risk-matrix-axis">{tr(impact===1?"low":impact===2?"medium":"high")}</span>
     {levels.map(probability=>{
      const selected=p===probability&&i===impact;
      const severity=criticality(probability,impact).level;
      const aria=tr("probability")+": "+tr(probability===1?"low":probability===2?"medium":"high")+", "+tr("impact")+": "+tr(impact===1?"low":impact===2?"medium":"high");
      return canManage?<button key={probability} type="button"
       className={"smn-risk-matrix-cell smn-risk-matrix-"+severity+(selected?" is-selected":"")}
       aria-label={aria} aria-pressed={selected} disabled={saving}
       onClick={()=>void save(probability,impact)}>
       {selected&&<span aria-hidden="true">✓</span>}
      </button>:<div key={probability} className={"smn-risk-matrix-cell smn-risk-matrix-"+severity+(selected?" is-selected":"")}
       role="img" aria-label={aria+(selected?" — sélectionné":"")}>
       {selected&&<span aria-hidden="true">✓</span>}
      </div>;
     })}
    </div>)}
   </div>
   <p className="mt-3" role="status"><span aria-hidden="true">{result.level==="high"?"▲":result.level==="medium"?"◆":result.level==="low"?"●":"?"} </span>
    {tr("symbol")}: <strong>{tr(result.level)}</strong> {result.score!==null&&<>({tr("score")}: {result.score})</>}

   </p>
   {saving&&<p role="status">{tr("saving")}</p>}
   {notice&&<p role="status" className="text-success">{tr("updated")}</p>}
   {error&&<p role="alert" className="text-danger">{tr(error)}</p>}
  </>}
 </section>;
}
