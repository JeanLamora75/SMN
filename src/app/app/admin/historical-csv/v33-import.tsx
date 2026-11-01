"use client";
import {useState} from "react";
import type {CsvV33Mapping,CsvV33Choice} from "@/server/historical-csv/v33";
type PreviewRow={line:number;cycleId:string;cycleName:string;metricCode:string;indicatorId:string;value:number;quality:string;existingValue:string|null;decision:"insert"|"keep"};
const scrum=["SP_INITIAL","SP_ADDED","SP_REMOVED","SP_DONE"];
const kanban=["STARTED","THROUGHPUT","WIP_FINAL","CYCLE_TIME_AVG","LEAD_TIME_AVG"];
export default function V33HistoricalCsvImport(){
 const [teamId,setTeamId]=useState("");
 const [mode,setMode]=useState<"scrum"|"kanban">("scrum");
 const [csv,setCsv]=useState("");
 const [map,setMap]=useState<Record<string,string>>({});
 const [preview,setPreview]=useState<PreviewRow[]|null>(null);
 const [choices,setChoices]=useState<Record<number,"keep"|"insert"|"replace">>({});
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const codes=mode==="scrum"?scrum:kanban;
 function input(){return {teamId:teamId.trim(),mode,csv,mappings:codes.filter(c=>map[c]?.trim()).map(code=>({code,indicatorId:map[code].trim()})) as CsvV33Mapping[]};}
 async function request(action:"preview"|"confirm"){
  setBusy(true);setMessage("");
  try{
   const data={action,input:input(),...(action==="confirm"?{choices:(preview??[]).map(r=>({
    line:r.line,decision:choices[r.line]??r.decision,expectedValue:r.existingValue
   })) as CsvV33Choice[]}: {})};
   const response=await fetch("/api/admin/historical-csv/v33",{method:"POST",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
   const result=await response.json();
   if(!response.ok||!result.ok){setMessage("Import refusé : "+(result.error??"Erreur inconnue"));return;}
   if(action==="preview"){
    setPreview(result.preview as PreviewRow[]);setChoices({});
    setMessage("Prévisualisation sans écriture : "+result.preview.length+" ligne(s).");
   }else{
    setPreview(null);setChoices({});
    setMessage("Lot enregistré : "+result.inserted+" ajout(s), "+result.replaced+" remplacement(s), "+result.preserved+" conservation(s).");
   }
  }catch{setMessage("Service d'import indisponible.");}finally{setBusy(false);}
 }
 return <section className="smn-panel rounded-4 p-4">
  <h1 className="h4">Import historique des indicateurs — v33</h1>
  <p className="text-secondary">Associez explicitement chaque code CSV à un identifiant d&apos;indicateur manuel actif pour cette équipe. Les indicateurs calculés, cycles clôturés et valeurs d&apos;autres équipes sont refusés.</p>
  <label className="form-label">ID de l&apos;équipe<input className="form-control" value={teamId} onChange={e=>{setTeamId(e.target.value);setPreview(null);}}/></label>
  <label className="form-label ms-2">Mode<select className="form-select" value={mode} onChange={e=>{setMode(e.target.value as "scrum"|"kanban");setPreview(null);}}>
   <option value="scrum">Scrum</option><option value="kanban">Kanban</option></select></label>
  <div className="table-responsive"><table className="table table-sm"><thead><tr><th>Code CSV</th><th>ID de l'indicateur manuel v33</th></tr></thead><tbody>
   {codes.map(code=><tr key={code}><td><code>{code}</code></td><td><input className="form-control form-control-sm" aria-label={"Indicateur pour "+code}
    value={map[code]??""} onChange={e=>{setMap(prev=>({...prev,[code]:e.target.value}));setPreview(null);}} placeholder="UUID de l'indicateur"/></td></tr>)}
  </tbody></table></div>
  <label className="form-label w-100">CSV — cycle_id,metric_code,value,quality
   <textarea className="form-control" rows={6} value={csv} onChange={e=>{setCsv(e.target.value);setPreview(null);}}/>
  </label>
  <button type="button" className="btn btn-outline-primary" disabled={busy||!csv.trim()||!teamId.trim()} onClick={()=>void request("preview")}>Prévisualiser</button>
  {preview&&<div className="mt-3"><h2 className="h6">Décisions avant confirmation</h2>
   <div className="table-responsive"><table className="table table-sm"><thead><tr><th>Cycle</th><th>Code</th><th>Valeur existante</th><th>Valeur proposée</th><th>Décision</th></tr></thead><tbody>
    {preview.map(r=><tr key={r.line}><td>{r.cycleName||r.cycleId}</td><td>{r.metricCode}</td><td>{r.existingValue??"Non renseignée"}</td><td>{r.value}</td>
     <td><select className="form-select form-select-sm" value={choices[r.line]??r.decision} onChange={e=>setChoices(v=>({...v,[r.line]:e.target.value as "keep"|"insert"|"replace"}))}>
      {r.existingValue===null?<option value="insert">Ajouter</option>:<><option value="keep">Conserver</option><option value="replace">Remplacer</option></>}
     </select></td></tr>)}
   </tbody></table></div>
   <button type="button" className="btn btn-primary" disabled={busy} onClick={()=>{
    if(window.confirm("Confirmer les modifications de valeurs des indicateurs v33 ?"))void request("confirm");
   }}>Confirmer le lot</button>
  </div>}
  {message&&<p role="status" className="alert alert-info mt-3">{message}</p>}
 </section>;
}
