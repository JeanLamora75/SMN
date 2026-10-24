"use client";
import {useEffect,useState} from "react";
type Catalog={mode:"scrum"|"kanban";cycles:{id:string;name:string}[];catalog:{code:string;description:string}[]};
export default function HistoricalCsvTemplateView(){
 const [data,setData]=useState<Catalog|null>(null),[error,setError]=useState("");
 const [csv,setCsv]=useState(""),[checking,setChecking]=useState(false);
 const [check,setCheck]=useState<{valid:boolean;rowCount:number;errors:{line:number;column:string;message:string}[]}|null>(null);
 async function validate(){setChecking(true);setCheck(null);try{const r=await fetch("/api/admin/historical-csv/validate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({csv})});const value=await r.json();if(Array.isArray(value.errors))setCheck(value);else setError("Vérification impossible.");}catch{setError("Vérification indisponible.");}finally{setChecking(false);}}
 useEffect(()=>{void fetch("/api/admin/historical-csv/template",{cache:"no-store"})
  .then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Catalog>;})
  .then(setData).catch(()=>setError("Catalogue momentanément indisponible."));},[]);
 return <section className="smn-panel rounded-4 p-4">
  <h1 className="h4">Modèle CSV historique</h1>
  <p className="text-secondary">Le modèle contient exactement quatre colonnes : <code>cycle_id,metric_code,value,quality</code>. Il ne crée aucun cycle ni ticket Jira. Les capacités J/H et les métriques dérivées ne sont pas importables.</p>
  <a className="btn btn-primary mb-3" href="/api/admin/historical-csv/template?download=1">Télécharger le modèle CSV</a>
  <div className="border rounded p-3 mb-4">
   <h2 className="h6">Vérifier un CSV avant import</h2>
   <p className="small text-secondary">Contrôle uniquement la syntaxe et le contrat de colonnes. Aucun enregistrement n'est créé ou modifié.</p>
   <label className="form-label">Fichier CSV<input type="file" accept=".csv,text/csv" className="form-control" onChange={async e=>{const file=e.target.files?.[0];if(file){if(file.size>1048576){setError("CSV limité à 1 Mo.");return;}setCsv(await file.text());setCheck(null);}}}/></label>
   <textarea className="form-control mt-2" rows={4} aria-label="Contenu CSV à vérifier" value={csv} onChange={e=>{setCsv(e.target.value);setCheck(null);}}/>
   <button type="button" className="btn btn-outline-primary mt-2" disabled={checking||!csv.trim()} onClick={validate}>{checking?"Vérification…":"Vérifier le fichier"}</button>
   {check&&<div className={"alert mt-3 "+(check.valid?"alert-success":"alert-warning")} role="status">{check.valid?`Syntaxe valide : ${check.rowCount} ligne(s). Aucune écriture effectuée.`:"Fichier invalide : aucune écriture effectuée."}
    {check.errors.length>0&&<ul className="mb-0 mt-2">{check.errors.map((issue,i)=><li key={i}>Ligne {issue.line} · {issue.column} : {issue.message}</li>)}</ul>}
   </div>}
  </div>
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
