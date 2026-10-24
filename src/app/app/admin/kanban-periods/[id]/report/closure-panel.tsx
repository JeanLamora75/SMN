"use client";
import {useEffect,useState} from "react";
type Version={version:number;createdAt:string;createdBy:string|null;snapshot:{period?:{name:string;startOn:string;endOn:string};goals?:unknown[];flow?:unknown;timing?:unknown;capacity?:unknown;qualitativeLinks?:{state:string};events?:{state:string}}};
export default function KanbanClosurePanel({periodId,status,canManage}:{periodId:string;status:string;canManage:boolean}){
 const [versions,setVersions]=useState<Version[]>([]),[state,setState]=useState(status);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [selected,setSelected]=useState<number|null>(null);
 const endpoint="/api/admin/kanban-periods/"+encodeURIComponent(periodId)+"/closure";
 async function refresh(){const r=await fetch(endpoint,{cache:"no-store"});if(!r.ok)throw Error();const j=await r.json();setVersions(j.versions);}
 useEffect(()=>{let live=true;fetch(endpoint,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(live)setVersions(d.versions);}).catch(()=>{if(live)setError("Versions indisponibles.");});return()=>{live=false;};},[endpoint]);
 async function action(kind:"close"|"reopen"){
  if(!window.confirm(kind==="close"?"Confirmer la clôture ? Les données actuelles seront figées dans une nouvelle version.":"Rouvrir volontairement cette période ? Les versions antérieures resteront conservées."))return;
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:kind})});
   if(!r.ok)throw Error();await refresh();setState(kind==="close"?"closed":"finished");
   setNotice(kind==="close"?"Version de clôture enregistrée.":"Période rouverte ; anciennes versions préservées.");
   window.location.reload();
  }catch{setError("Opération refusée ou indisponible.");}finally{setBusy(false);}
 }
 const version=versions.find(v=>v.version===selected);
 return <section className="smn-panel rounded-4 p-3 p-md-4 mb-3">
  <h2 className="h5">Clôture et versions du bilan Kanban</h2>
  <p className="small text-secondary">Les mesures absentes restent non renseignées. Chaque clôture crée une nouvelle version historique immuable.</p>
  <p className="alert alert-warning small">Limite actuelle : les événements et liens qualitatifs ne sont pas encore intégrés aux instantanés. Vérifiez ces données avant toute clôture.</p>
  {canManage&&state==="finished"&&<button type="button" className="btn btn-primary me-2" disabled={busy} onClick={()=>action("close")}>Clôturer la période</button>}
  {canManage&&state==="closed"&&<button type="button" className="btn btn-outline-primary" disabled={busy} onClick={()=>action("reopen")}>Rouvrir la période</button>}
  {error&&<p role="alert" className="alert alert-warning mt-2">{error}</p>}
  {notice&&<p role="status" className="alert alert-success mt-2">{notice}</p>}
  <h3 className="h6 mt-3">Versions conservées</h3>
  {!versions.length?<p className="text-secondary">Aucune clôture enregistrée.</p>:<div className="d-flex gap-2 flex-wrap">{versions.map(v=><button type="button" key={v.version} className="btn btn-outline-secondary btn-sm" onClick={()=>setSelected(v.version)}>V{v.version} — {v.createdAt}</button>)}</div>}
  {version&&<div className="border rounded p-3 mt-3">
   <h4 className="h6">Instantané V{version.version} — {version.createdAt}</h4>
   <p className="small">Auteur : {version.createdBy??"Non renseigné"}</p>
   <pre className="small text-wrap bg-body-tertiary p-2 rounded" style={{maxHeight:330,overflow:"auto"}}>{JSON.stringify(version.snapshot,null,2)}</pre>
   <button className="btn btn-outline-secondary btn-sm" onClick={()=>setSelected(null)}>Masquer</button>
  </div>}
 </section>;
}
