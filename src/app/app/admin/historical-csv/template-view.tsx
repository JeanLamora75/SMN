import HistoricalRevisionsPanel from "./historical-revisions-panel";
"use client";
import {useEffect,useRef,useState} from "react";
type Preview={line:number;cycleId:string;cycleName:string|null;metricCode:string;value:number;quality:string;existingValue:number|null;impact:string;decision:"keep"|"insert";validation:string};
type Catalog={mode:"scrum"|"kanban";cycles:{id:string;name:string}[];catalog:{code:string;description:string}[]};
export default function HistoricalCsvTemplateView(){
 const [data,setData]=useState<Catalog|null>(null),[error,setError]=useState("");
 const [csv,setCsv]=useState(""),[checking,setChecking]=useState(false);
 const [replacement,setReplacement]=useState<Record<number,boolean>>({});
 const [confirming,setConfirming]=useState(false),[confirmation,setConfirmation]=useState("");
 const version=useRef(0);
 const [attempts,setAttempts]=useState<{id:string;createdAt:string;status:string;mode:string;batchId:string|null;readCount:number;recognizedCount:number;appliedCount:number;preservedCount:number;rejectedCount:number;cycleIds:string[];errors:{line:number;column:string;message:string}[]}[]>([]);
 async function loadAttempts(){try{const r=await fetch("/api/admin/historical-csv/attempts",{cache:"no-store"});if(r.ok)setAttempts((await r.json()).attempts??[]);}catch{}}
 async function cancelPreview(){if(check?.attemptId)await fetch("/api/admin/historical-csv/attempts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({attemptId:check.attemptId})}).catch(()=>undefined);setCheck(null);void loadAttempts();}
 const [check,setCheck]=useState<{valid:boolean;rowCount:number;errors:{line:number;column:string;message:string}[];preview?:Preview[];confirmable?:boolean;attemptId?:string}|null>(null);
 async function confirmImport(){
  if(!check?.valid||!check.preview||confirming)return;
  const choices=check.preview.map(r=>({line:r.line,expectedValue:r.existingValue,decision:r.decision==="insert"?"insert":replacement[r.line]?"replace":"keep"}));
  const details=check.preview.filter(r=>r.decision==="insert"||replacement[r.line]).map(r=>r.cycleId+" · "+r.metricCode+" : "+(r.existingValue??"Non renseigné")+" → "+r.value+" ("+r.quality+")").join("\n");
  if(!window.confirm("Confirmer les changements de ce lot ?\n"+details+"\nLes autres valeurs seront conservées."))return;
  setConfirming(true);setConfirmation("");
  try{
   const response=await fetch("/api/admin/historical-csv/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({csv,choices})});
   const result=await response.json();
   if(!response.ok||!result.ok){setConfirmation("Import refusé : "+(result.error??"Erreur inconnue"));return;}
   setConfirmation("Lot "+result.batchId+" enregistré : "+result.inserted+" ajout(s), "+result.replaced+" remplacement(s), "+result.preserved+" conservation(s).");
   setCheck(null);setReplacement({});void loadAttempts();
  }catch{setConfirmation("Import indisponible.");}finally{setConfirming(false);}
 }
 async function validate(){const snapshot=version.current;setChecking(true);setCheck(null);setReplacement({});try{const r=await fetch("/api/admin/historical-csv/validate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({csv})});const value=await r.json();if(Array.isArray(value.errors)&&version.current===snapshot)setCheck(value);else setError("Vérification impossible.");}catch{setError("Vérification indisponible.");}finally{setChecking(false);}}
 useEffect(()=>{const task=window.setTimeout(()=>{void loadAttempts();},0);void fetch("/api/admin/historical-csv/template",{cache:"no-store"})
  .then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Catalog>;})
  .then(setData).catch(()=>setError("Catalogue momentanément indisponible."));return ()=>window.clearTimeout(task);},[]);
 return <section className="smn-panel rounded-4 p-4">
  <h1 className="h4">Modèle CSV historique</h1>
  <p className="text-secondary">Le modèle contient exactement quatre colonnes : <code>cycle_id,metric_code,value,quality</code>. Il ne crée aucun cycle ni ticket Jira. Les capacités J/H et les métriques dérivées ne sont pas importables.</p>
  <a className="btn btn-primary mb-3" href="/api/admin/historical-csv/template?download=1">Télécharger le modèle CSV</a>
  <div className="border rounded p-3 mb-4">
   <h2 className="h6">Vérifier un CSV avant import</h2>
   <p className="small text-secondary">Contrôle uniquement la syntaxe et le contrat de colonnes. Aucun enregistrement n&apos;est créé ou modifié.</p>
   <label className="form-label">Fichier CSV<input type="file" accept=".csv,text/csv" className="form-control" onChange={async e=>{const file=e.target.files?.[0];if(file){if(file.size>1048576){setError("CSV limité à 1 Mo.");return;}const raw=await file.text();version.current++;setCsv(raw);setCheck(null);setReplacement({});}}}/></label>
   <textarea className="form-control mt-2" rows={4} aria-label="Contenu CSV à vérifier" value={csv} onChange={e=>{version.current++;setCsv(e.target.value);setCheck(null);setReplacement({});}}/>
   <button type="button" className="btn btn-outline-primary mt-2" disabled={checking||!csv.trim()} onClick={validate}>{checking?"Vérification…":"Vérifier le fichier"}</button>
   {check&&<div className={"alert mt-3 "+(check.valid?"alert-success":"alert-warning")} role="status">{check.valid?`Syntaxe valide : ${check.rowCount} ligne(s). Aucune écriture effectuée.`:"Fichier invalide : aucune écriture effectuée."}
    {check.errors.length>0&&<ul className="mb-0 mt-2">{check.errors.map((issue,i)=><li key={i}>Ligne {issue.line} · {issue.column} : {issue.message}</li>)}</ul>}
   </div>}
   {check?.valid&&<div className="mt-3">
    <h3 className="h6">Aperçu des impacts — lecture seule</h3>
    <p className="small text-secondary">Les valeurs déjà enregistrées sont conservées par défaut. Fermer cet aperçu ou changer de fichier n&apos;effectue aucun import.</p>
    <div className="table-responsive"><table className="table table-sm align-middle">
     <thead><tr><th>Ligne</th><th>Cycle existant</th><th>Métrique</th><th>Valeur actuelle</th><th>Valeur proposée</th><th>Qualité</th><th>Résultat</th><th>Décision de préparation</th></tr></thead>
     <tbody>{(check.preview??[]).map(item=><tr key={item.line}>
      <td>{item.line}</td><td>{item.cycleName??item.cycleId}<div className="small text-secondary">{item.cycleId}</div></td>
      <td><code>{item.metricCode}</code></td><td>{item.existingValue===null?"Non renseignée":item.existingValue}</td>
      <td>{item.value}</td><td>{item.quality==="known"?"Connue":"Estimée"}</td>
      <td>{item.impact==="preserved"?"Valide — valeur déjà renseignée":"Valide — champ vide"}</td>
      <td>{item.decision==="keep"?<select className="form-select form-select-sm" aria-label={`Décision ligne ${item.line}`} value={replacement[item.line]?"replace":"keep"} onChange={e=>setReplacement(prev=>({...prev,[item.line]:e.target.value==="replace"}))}><option value="keep">Conserver la valeur existante (défaut)</option><option value="replace">Remplacer — choix volontaire</option></select>:<span>Nouvelle valeur proposée</span>}</td>
     </tr>)}</tbody>
    </table></div>
    <button type="button" className="btn btn-primary btn-sm me-2" disabled={confirming} onClick={confirmImport}>{confirming?"Import en cours…":"Confirmer le lot"}</button>
    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={()=>{void cancelPreview();}}>Annuler sans importer</button>
   </div>}
  </div>
  {confirmation&&<p role="status" className="alert alert-info">{confirmation}</p>}
  <section className="mt-4"><h2 className="h6">Journal des tentatives CSV</h2>
   <button type="button" className="btn btn-outline-secondary btn-sm mb-2" onClick={()=>{void loadAttempts();}}>Actualiser le journal</button>
   <div className="table-responsive"><table className="table table-sm"><thead><tr><th>Date</th><th>État</th><th>Lues</th><th>Reconnues</th><th>Appliquées</th><th>Conservées</th><th>Rejetées</th><th>Lot et cycles</th><th>Erreurs</th></tr></thead>
   <tbody>{attempts.map(a=><tr key={a.id}><td>{a.createdAt}</td><td>{a.status}</td><td>{a.readCount}</td><td>{a.recognizedCount}</td><td>{a.appliedCount}</td><td>{a.preservedCount}</td><td>{a.rejectedCount}</td><td>{a.batchId??a.id}<div className="small">{(a.cycleIds??[]).join(", ")}</div></td><td>{(a.errors??[]).map((e,i)=><div key={i}>Ligne {e.line} : {e.message}</div>)}</td></tr>)}</tbody>
   </table></div></section>
  <HistoricalRevisionsPanel/>
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
