"use client";
import {useEffect,useState} from "react";
type Catalog={mode:"scrum"|"kanban";cycles:{id:string;name:string}[];catalog:{code:string;description:string}[]};
export default function HistoricalCsvTemplateView(){
 const [data,setData]=useState<Catalog|null>(null),[error,setError]=useState("");
 useEffect(()=>{void fetch("/api/admin/historical-csv/template",{cache:"no-store"})
  .then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Catalog>;})
  .then(setData).catch(()=>setError("Catalogue momentanément indisponible."));},[]);
 return <section className="smn-panel rounded-4 p-4">
  <h1 className="h4">Modèle CSV historique</h1>
  <p className="text-secondary">Le modèle contient exactement quatre colonnes : <code>cycle_id,metric_code,value,quality</code>. Il ne crée aucun cycle ni ticket Jira. Les capacités J/H et les métriques dérivées ne sont pas importables.</p>
  <a className="btn btn-primary mb-3" href="/api/admin/historical-csv/template?download=1">Télécharger le modèle CSV</a>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {data&&<>
   <h2 className="h6">Codes sources autorisés — {data.mode==="scrum"?"Scrum":"Kanban"}</h2>
   <table className="table table-sm"><thead><tr><th>metric_code</th><th>Signification</th></tr></thead><tbody>
   {data.catalog.map(c=><tr key={c.code}><td><code>{c.code}</code></td><td>{c.description}</td></tr>)}
   </tbody></table>
   <h2 className="h6 mt-4">Identifiants des cycles existants</h2>
   <p className="small text-secondary">Copiez uniquement les identifiants réels ci-dessous dans la colonne <code>cycle_id</code>. Les valeurs de <code>quality</code> à utiliser sont <code>known</code> ou <code>estimated</code>.</p>
   {data.cycles.length?<div className="table-responsive" style={{maxHeight:340,overflowY:"auto"}}>
    <table className="table table-sm"><thead><tr><th>Cycle</th><th>cycle_id</th></tr></thead><tbody>
    {data.cycles.map(c=><tr key={c.id}><td>{c.name}</td><td><code>{c.id}</code></td></tr>)}
    </tbody></table></div>:<p>Aucun cycle existant.</p>}
  </>}
 </section>;
}
