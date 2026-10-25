"use client";
import {useCallback,useEffect,useState} from "react";
type Revision={id:string;batchId:string;cycleId:string;metricCode:string;before:number|null;after:number;beforeQuality:string|null;quality:string;sourceLine:number|null;action:string;changedAt:string;actorId:string|null;origin:string};
export default function HistoricalRevisionsPanel(){
 const [rows,setRows]=useState<Revision[]>([]),[error,setError]=useState("");
 const [cycle,setCycle]=useState(""),[busy,setBusy]=useState(false);
 const load=useCallback(async ()=>{setBusy(true);setError("");
  try{const query=cycle.trim()?"?cycleId="+encodeURIComponent(cycle.trim()):"";
   const r=await fetch("/api/admin/historical-csv/revisions"+query,{cache:"no-store"});
   if(!r.ok)throw Error("Impossible de consulter les révisions.");
   const data=await r.json() as {revisions:Revision[]};setRows(data.revisions);
  }catch{setError("Historique momentanément indisponible.");}finally{setBusy(false);}
 },[cycle]);
 useEffect(()=>{const task=window.setTimeout(()=>{void load();},0);return ()=>window.clearTimeout(task);},[load]);
 const quality=(v:string|null)=>v==="known"?"Connue":v==="estimated"?"Estimée":"Non renseignée / non attestée";
 return <section className="mt-4">
  <h2 className="h6">Historique des révisions CSV</h2>
  <p className="small text-secondary">Saisies rétrospectives : les dates indiquent l&apos;enregistrement dans SMN, pas la date d&apos;observation historique. Les qualités anciennes restent préservées.</p>
  <div className="d-flex gap-2 mb-2 flex-wrap">
   <input className="form-control form-control-sm" style={{maxWidth:380}} aria-label="Filtrer par identifiant de cycle" placeholder="Identifiant de cycle (facultatif)" value={cycle} onChange={e=>setCycle(e.target.value)}/>
   <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy} onClick={()=>void load()}>Consulter</button>
  </div>
  {error&&<p role="alert" className="text-danger">{error}</p>}
  <div className="table-responsive"><table className="table table-sm">
   <thead><tr><th>Enregistré le</th><th>Cycle / métrique</th><th>Avant</th><th>Qualité précédente</th><th>Après</th><th>Nouvelle qualité</th><th>Origine</th><th>Auteur</th></tr></thead>
   <tbody>{rows.map(r=><tr key={r.id}>
    <td>{r.changedAt}</td><td><code>{r.cycleId}</code><div>{r.metricCode}</div></td>
    <td>{r.before===null?"Non renseignée":r.before}</td><td>{quality(r.beforeQuality)}</td>
    <td>{r.after}</td><td>{quality(r.quality)}</td>
    <td>CSV rétrospectif · lot <code>{r.batchId}</code>{r.sourceLine!==null?" · ligne "+r.sourceLine:""}</td>
    <td>{r.actorId??"Non disponible"}</td>
   </tr>)}</tbody>
  </table>{!rows.length&&!error&&<p className="small text-secondary">Aucune révision CSV trouvée.</p>}</div>
 </section>;
}
