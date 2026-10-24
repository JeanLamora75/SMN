"use client";
import {useState} from "react";
const kanbanReportSections=["objectives","flow","timing","capacity","trends"] as const;
type KanbanReportSection=typeof kanbanReportSections[number];
type Data={period:{name:string;team:string;status:string;startOn:string;endOn:string};provisional:boolean;source:string;snapshotVersion:number|null;goals:unknown;flow:unknown;timing:unknown;capacity:unknown;trends:unknown;quality:{qualitativeLinks:string;events:string}};
const labels:Record<KanbanReportSection,string>={objectives:"Objectifs",flow:"Comptages : commencés, terminés et WIP final",timing:"Cycle Time et Lead Time (jours calendaires)",capacity:"Capacité (J/H)",trends:"Tendances des périodes clôturées"};
const safeValue=(value:unknown)=>value===null||value===undefined?"Non renseigné":typeof value==="object"?JSON.stringify(value,null,2):String(value);
export default function KanbanReportPreview({data}:{data:Data}){
 const [selected,setSelected]=useState<KanbanReportSection[]>([...kanbanReportSections]);
 const [show,setShow]=useState(false);
 return <section className="smn-panel rounded-4 p-4">
  <h2 className="h5">Rubriques du rapport</h2>
  <p className="text-secondary small">Sélectionnez les sections à inclure. L’aperçu HTML n’enregistre aucun PDF et ne modifie aucune donnée.</p>
  {kanbanReportSections.map(key=><label key={key} className="d-block form-check mb-2">
   <input type="checkbox" className="form-check-input" checked={selected.includes(key)} onChange={e=>setSelected(old=>e.target.checked?[...old,key]:old.filter(x=>x!==key))}/>
   <span className="form-check-label">{labels[key]}</span>
  </label>)}
  <button type="button" className="btn btn-outline-primary my-3" onClick={()=>setShow(v=>!v)}>{show?"Masquer l’aperçu":"Afficher l’aperçu HTML"}</button>
  {show&&<article className="border rounded p-4" aria-label="Aperçu du rapport Kanban">
   <h2 className="h4">{data.period.name}</h2>
   <p>{data.period.team} · {data.period.startOn} — {data.period.endOn} · {data.period.status}</p>
   <p><strong>{data.provisional?"Provisoire":"Clôturé V"+data.snapshotVersion}</strong></p>
   {selected.map(key=><section key={key} className="border-top py-3">
    <h3 className="h5">{labels[key]}</h3>
    <pre className="small text-wrap mb-0">{safeValue(key==="objectives"?data.goals:key==="flow"?data.flow:key==="timing"?data.timing:key==="capacity"?data.capacity:data.trends)}</pre>
   </section>)}
   <p className="small text-secondary">Les événements et liens qualitatifs ne sont pas encore intégrés. Aucune valeur en Story Points n’est produite.</p>
  </article>}
  <p className="small text-warning-emphasis mt-3">Export PDF non disponible dans cette première intégration : aucune archive n’est créée avant un export final vérifié.</p>
 </section>;
}
