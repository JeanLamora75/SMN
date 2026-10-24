"use client";
import {useEffect,useState} from "react";
import {useUnsavedChanges} from "@/app/app/use-unsaved-changes";
type Counts={started:number|null;throughput:number|null;wipFinal:number|null};
type Time={days:number|null;convention:"calendar"|"business"|"unknown";source:string};
type Draft={counts:Counts;timing:{cycle:Time;lead:Time}};
const initial:Draft={counts:{started:null,throughput:null,wipFinal:null},timing:{cycle:{days:null,convention:"unknown",source:""},lead:{days:null,convention:"unknown",source:""}}};
const countFields=[["started","Commencés"],["throughput","Terminés (Throughput)"],["wipFinal","WIP final"]] as const;
export default function KanbanMetricsPanel({periodId,canManage,closed}:{periodId:string;canManage:boolean;closed:boolean}){
 const [draft,setDraft]=useState<Draft>(initial);
 const [saved,setSaved]=useState<Draft>(initial);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[message,setMessage]=useState("");
 const dirty=JSON.stringify(draft)!==JSON.stringify(saved);
 useUnsavedChanges(dirty||busy,"Des modifications du bilan Kanban ne sont pas enregistrées. Quitter sans sauvegarder ?");
 const base="/api/admin/kanban-periods/"+encodeURIComponent(periodId);
 useEffect(()=>{let live=true;
  Promise.all([fetch(base+"/flow",{cache:"no-store"}),fetch(base+"/timing",{cache:"no-store"})])
  .then(async ([a,b])=>{if(!a.ok||!b.ok)throw Error();return Promise.all([a.json(),b.json()]);})
  .then(([a,b])=>{if(live){const data={counts:a.counts,timing:{cycle:b.cycle,lead:b.lead}};setDraft(data);setSaved(data);}})
  .catch(()=>{if(live)setError("Métriques indisponibles.");}).finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[base]);
 async function save(){
  setBusy(true);setError("");setMessage("");
  try{const r=await fetch(base+"/metrics",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)});
   if(!r.ok)throw Error();setSaved(draft);setMessage("Les cinq métriques ont été enregistrées ensemble.");
  }catch{setError("Enregistrement refusé. Les brouillons sont conservés.");}finally{setBusy(false);}
 }
 const updateCount=(key:keyof Counts,n:number|null)=>{setDraft(v=>({...v,counts:{...v.counts,[key]:n}}));setMessage("");};
 const updateTime=(key:"cycle"|"lead",patch:Partial<Time>)=>{setDraft(v=>({...v,timing:{...v.timing,[key]:{...v.timing[key],...patch}}}));setMessage("");};
 const invalid=Object.values(draft.counts).some(v=>v!==null&&(!Number.isSafeInteger(v)||v<0))||
 Object.values(draft.timing).some(v=>v.days!==null&&(!Number.isFinite(v.days)||v.days<0||v.days>100000));
 const disabled=!canManage||closed||busy||loading;
 return <div>
  <p className="text-secondary small">Chaque comptage est indépendant. Champ vide = non renseigné, zéro = valeur connue. Les tendances utilisent exclusivement les valeurs sauvegardées.</p>
  {countFields.map(([key,label])=><label className="form-label d-block" key={key}>{label}
   <input className="form-control" type="number" min={0} step={1} disabled={disabled} placeholder="Non renseigné"
   value={draft.counts[key]??""} onChange={e=>updateCount(key,e.target.value===""?null:Number(e.target.value))}/>
  </label>)}
  {(["cycle","lead"] as const).map(key=><fieldset className="border rounded p-3 my-3" key={key} disabled={disabled}>
   <legend className="h6 float-none w-auto px-1">{key==="cycle"?"Cycle Time moyen":"Lead Time moyen"}</legend>
   <label className="form-label d-block">Moyenne (jours)<input className="form-control" type="number" step="any" min={0} placeholder="Non renseigné"
    value={draft.timing[key].days??""} onChange={e=>updateTime(key,{days:e.target.value===""?null:Number(e.target.value)})}/></label>
   <label className="form-label d-block">Convention<select className="form-select" value={draft.timing[key].convention}
    onChange={e=>updateTime(key,{convention:e.target.value as Time["convention"]})}>
    <option value="calendar">Jours calendaires</option><option value="business">Jours ouvrés</option><option value="unknown">Inconnue</option>
   </select></label>
   <label className="form-label d-block">Provenance<input className="form-control" maxLength={500} value={draft.timing[key].source}
    onChange={e=>updateTime(key,{source:e.target.value})}/></label>
   {draft.timing[key].days!==null&&<p className="small mb-0">{new Intl.NumberFormat("fr-FR",{minimumFractionDigits:1,maximumFractionDigits:1}).format(draft.timing[key].days)} j — {dirty?"Provisoire (non enregistré)":"Enregistré"}</p>}
   {draft.timing[key].days!==null&&draft.timing[key].convention!=="calendar"&&<p className="text-warning-emphasis small">Convention non directement comparable aux jours calendaires.</p>}
  </fieldset>)}
  {dirty&&<p className="small text-warning-emphasis" role="status">Modifications non enregistrées — affichages dérivés provisoires.</p>}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {message&&<p role="status" className="alert alert-success">{message}</p>}
  {canManage&&!closed&&<button className="btn btn-primary" type="button" disabled={disabled||invalid||!dirty} onClick={save}>Enregistrer les cinq métriques</button>}
 </div>;
}
