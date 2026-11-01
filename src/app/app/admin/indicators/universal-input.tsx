"use client";
import {useEffect,useState} from "react";
type D={id:string;tag:string;name:string;indicator_type:string;formula:string|null};
type Form={revision:number;definitions:D[];values:{indicator_id:string;value:string|null}[]};
type Result={indicatorId:string;kind:string;value?:string;reason?:string;sourceTag?:string};
export default function UniversalIndicatorInput({teamId,cycleType,cycleId}:{teamId:string;cycleType:"scrum"|"kanban";cycleId:string}){
 const [open,setOpen]=useState(false),[form,setForm]=useState<Form|null>(null),[draft,setDraft]=useState<Record<string,string>>({}),[preview,setPreview]=useState<Result[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 useEffect(()=>{if(!open)return;const controller=new AbortController();
  void fetch("/api/admin/indicators/input?"+new URLSearchParams({teamId,cycleType,cycleId}),{cache:"no-store",signal:controller.signal})
   .then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d as Form;})
   .then(d=>{if(controller.signal.aborted)return;setForm(d);setDraft(Object.fromEntries(d.values.map(v=>[v.indicator_id,v.value??""])));setPreview(null);setError("");})
   .catch(e=>{if(!controller.signal.aborted)setError(String(e));});
  return ()=>controller.abort();
 },[open,teamId,cycleType,cycleId]);
 const manual=form?.definitions.filter(d=>d.indicator_type==="manual")??[];
 const computed=form?.definitions.filter(d=>d.indicator_type==="computed")??[];
 async function run(action:"preview"|"save"){
  if(!form)return;setBusy(true);setError("");setMessage("");
  const changes=manual.map(d=>({indicatorId:d.id,value:(draft[d.id]??"").trim()||null}));
  try{const r=await fetch("/api/admin/indicators/input",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,teamId,cycleType,cycleId,expectedRevision:form.revision,changes})});
   const data=await r.json();if(!r.ok||data.ok===false)throw Error(data.error??"unavailable");
   if(action==="preview"){setPreview(data.results);setMessage("Aperçu calculé sans enregistrement.");}
   else{setOpen(false);setForm(null);setPreview(null);setMessage("Valeurs enregistrées.");}
  }catch(e){setError(e instanceof Error?e.message:"unavailable");}finally{setBusy(false);}
 }
 return <div>
  <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>{setOpen(true);setMessage("");}}>Saisir les indicateurs</button>
  {message&&!open&&<p role="status">{message}</p>}
  {open&&<div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="smn-universal-indicators-title" tabIndex={-1}>
   <div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content">
    <div className="modal-header"><h2 className="modal-title h5" id="smn-universal-indicators-title">Saisie des indicateurs</h2>
     <button type="button" className="btn-close" aria-label="Fermer" onClick={()=>setOpen(false)}/></div>
    <div className="modal-body">
     {error&&<p role="alert" className="alert alert-danger">{error}</p>}
     {message&&<p role="status" className="alert alert-info">{message}</p>}
     {!form&&!error&&<p role="status">Chargement…</p>}
     {manual.map(d=><label key={d.id} className="form-label d-block">{d.tag} — {d.name}
      <input className="form-control" inputMode="decimal" type="text" value={draft[d.id]??""} onChange={e=>{setDraft(v=>({...v,[d.id]:e.target.value}));setPreview(null);}}/></label>)}
     {computed.length>0&&<section aria-label="Valeurs calculées" className="border rounded-3 p-3">
      <h3 className="h6">Indicateurs calculés (lecture seule)</h3>
      {computed.map(d=>{const result=preview?.find(x=>x.indicatorId===d.id);return <p key={d.id}>{d.tag} — {d.name} : {result?.kind==="available"?result.value:result?.reason? "Indisponible : "+result.reason+(result.sourceTag?" ("+result.sourceTag+")":""):"Aperçu nécessaire"}</p>;})}
     </section>}
    </div>
    <div className="modal-footer">
     <button type="button" className="btn btn-outline-secondary" onClick={()=>setOpen(false)}>Annuler</button>
     <button type="button" className="btn btn-outline-primary" disabled={!form||busy||manual.length===0} onClick={()=>void run("preview")}>Prévisualiser</button>
     <button type="button" className="btn btn-primary" disabled={!preview||busy} onClick={()=>void run("save")}>Enregistrer</button>
    </div>
   </div></div>
  </div>}
 </div>;
}
