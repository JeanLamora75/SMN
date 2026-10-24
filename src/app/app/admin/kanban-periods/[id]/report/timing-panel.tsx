"use client";
import {useEffect,useState} from "react";
type Timing={days:number|null;convention:"calendar"|"business"|"unknown";source:string};
type Value={cycle:Timing;lead:Timing};
const blank:Timing={days:null,convention:"calendar",source:""};
export default function KanbanTimingPanel({periodId,canManage,closed}:{periodId:string;canManage:boolean;closed:boolean}){
 const [value,setValue]=useState<Value>({cycle:{...blank},lead:{...blank}});
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const url="/api/admin/kanban-periods/"+encodeURIComponent(periodId)+"/timing";
 useEffect(()=>{let active=true;fetch(url,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(active)setValue({cycle:d.cycle,lead:d.lead});}).catch(()=>{if(active)setError("Moyennes indisponibles.");});return()=>{active=false;};},[url]);
 function update(key:"cycle"|"lead",patch:Partial<Timing>){setValue(old=>({...old,[key]:{...old[key],...patch}}));setNotice("");}
 async function save(){setBusy(true);setError("");try{
  const r=await fetch(url,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
  if(!r.ok)throw Error();setNotice("Moyennes et provenances enregistrées.");
 }catch{setError("Impossible d’enregistrer les moyennes.");}finally{setBusy(false);}}
 const locale=typeof document!=="undefined"&&document.documentElement.lang.startsWith("en")?"en-GB":"fr-FR";
 return <div className="border-top mt-4 pt-3">
  <h3 className="h6">Cycle Time et Lead Time moyens</h3>
  <p className="small text-secondary">Cycle Time : éléments terminés dans la période. Lead Time : éléments livrés dans la période. Les deux populations peuvent différer ; les week-ends sont inclus dans les jours calendaires.</p>
  {(["cycle","lead"] as const).map(key=><div key={key} className="border rounded p-3 mb-3">
   <h4 className="h6">{key==="cycle"?"Cycle Time moyen":"Lead Time moyen"}</h4>
   <label className="form-label">Moyenne (jours)<input type="number" min="0" step="any" className="form-control" placeholder="Non renseigné"
    disabled={!canManage||closed||busy} value={value[key].days??""} onChange={e=>update(key,{days:e.target.value===""?null:Number(e.target.value)})}/></label>
   <label className="form-label d-block">Convention<select className="form-select" disabled={!canManage||closed||busy} value={value[key].convention} onChange={e=>update(key,{convention:e.target.value as Timing["convention"]})}>
    <option value="calendar">Jours calendaires (week-ends inclus)</option><option value="business">Jours ouvrés</option><option value="unknown">Convention inconnue</option>
   </select></label>
   <label className="form-label d-block">Provenance<input className="form-control" maxLength={500} disabled={!canManage||closed||busy} value={value[key].source} onChange={e=>update(key,{source:e.target.value})} placeholder="Saisie manuelle, outil externe…"/></label>
   {value[key].days!==null&&<p className="small mb-1">Valeur affichée : {new Intl.NumberFormat(locale,{minimumFractionDigits:1,maximumFractionDigits:1}).format(value[key].days)} jour(s){value[key].convention==="calendar"?" calendaires":""}</p>}
   {value[key].days!==null&&value[key].convention!=="calendar"&&<p role="status" className="alert alert-warning py-2">Non directement comparable : convention à vérifier ou conversion fiable nécessaire.</p>}
  </div>)}
  {error&&<p className="alert alert-warning" role="alert">{error}</p>}
  {notice&&<p className="alert alert-success" role="status">{notice}</p>}
  {canManage&&!closed&&<button className="btn btn-primary" type="button" onClick={save} disabled={busy||Object.values(value).some(x=>x.days!==null&&(!Number.isFinite(x.days)||x.days<0||x.days>100000))}>Enregistrer les moyennes</button>}
 </div>;
}
