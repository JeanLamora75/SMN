"use client";
import {useEffect,useState} from "react";
type Entry={id:string;type:"human"|"ai";origin:string;createdAt:string;cycleId:string;scope:string;content:string;archiveId:string|null};
export default function ReportAnalysisChoices({sprintId}:{sprintId:string}){
 const [items,setItems]=useState<Entry[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;fetch("/api/admin/reports/sprints/"+sprintId+"/analysis-choices",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then((body:{candidates:Entry[];selected:string[]})=>{if(active){setItems(body.candidates);setSelected(body.selected);}}).catch(()=>{if(active)setMessage("Analyses indisponibles.");});return ()=>{active=false;};},[sprintId]);
 async function save(){
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/admin/reports/sprints/"+sprintId+"/analysis-choices",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({selected})});
   if(!r.ok)throw Error("Sélection refusée");setMessage("Sélection enregistrée. Elle sera figée lors de la prochaine préparation du PDF.");
  }catch{setMessage("Enregistrement impossible.");}finally{setBusy(false);}
 }
 return <section className="border rounded p-3"><h2 className="h5">Analyses à inclure dans le rapport HTML/PDF</h2>
  <p className="small text-secondary">Aucune analyse n’est incluse automatiquement. Les analyses sont des interprétations, jamais des KPI ou faits mesurés. Les PDF déjà archivés ne seront pas modifiés.</p>
  {items.length===0?<p>Aucune analyse disponible.</p>:<div className="d-grid gap-2">{items.map(item=>{
   const key=item.type+":"+item.id;return <label key={key} className="border rounded p-2">
    <input className="form-check-input me-2" type="checkbox" checked={selected.includes(key)} onChange={e=>setSelected(old=>e.target.checked?[...old,key]:old.filter(id=>id!==key))}/>
    <strong>{item.origin}</strong> · {item.scope} · {item.createdAt} · cycle {item.cycleId}
    <span className="d-block text-secondary small">{item.content.slice(0,240)}</span>
   </label>;
  })}</div>}
  <button type="button" className="btn btn-outline-primary mt-3" disabled={busy} onClick={()=>void save()}>Enregistrer les analyses choisies</button>
  {message&&<p role="status" className="mt-2">{message}</p>}
 </section>;
}
