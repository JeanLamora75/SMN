"use client";
import {useEffect,useState} from "react";
type Key="started"|"throughput"|"wipFinal";
type Counts=Record<Key,number|null>;
const fields:[Key,string,string][]=[
 ["started","Éléments commencés","Nombre d’éléments commencés durant cette période"],
 ["throughput","Éléments terminés (Throughput)","Éléments terminés pendant la période, même commencés avant"],
 ["wipFinal","WIP final","Éléments toujours en cours à la fin de la période"]
];
export default function KanbanFlowPanel({periodId,canManage,closed}:{periodId:string;canManage:boolean;closed:boolean}){
 const [counts,setCounts]=useState<Counts>({started:null,throughput:null,wipFinal:null});
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const url="/api/admin/kanban-periods/"+encodeURIComponent(periodId)+"/flow";
 useEffect(()=>{let live=true;fetch(url,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();})
 .then(d=>{if(live)setCounts(d.counts);}).catch(()=>{if(live)setError("Comptages indisponibles.");});
 return()=>{live=false;};},[url]);
 async function save(){
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch(url,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(counts)});
   if(!r.ok)throw Error();setNotice("Comptages enregistrés indépendamment des objectifs et de la capacité.");
  }catch{setError("Enregistrement impossible.");}finally{setBusy(false);}
 }
 return <div>
  <p className="text-secondary small">Chaque mesure est indépendante. Un champ vide signifie « Non renseigné » ; 0 est une valeur connue.</p>
  {fields.map(([key,label,help])=><div className="mb-3" key={key}>
   <label className="form-label" htmlFor={"kanban-flow-"+key}>{label}</label>
   <input id={"kanban-flow-"+key} type="number" min={0} step={1} className="form-control" disabled={!canManage||closed||busy}
    value={counts[key]??""} placeholder="Non renseigné" aria-describedby={"kanban-flow-help-"+key}
    onChange={e=>{const v=e.target.value;setCounts(old=>({...old,[key]:v===""?null:Number(v)}));}}/>
   <div id={"kanban-flow-help-"+key} className="form-text">{help}</div>
  </div>)}
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {notice&&<p role="status" className="alert alert-success">{notice}</p>}
  {canManage&&!closed&&<button type="button" className="btn btn-primary" disabled={busy||Object.values(counts).some(v=>v!==null&&(!Number.isSafeInteger(v)||v<0))} onClick={save}>Enregistrer les métriques</button>}
 </div>;
}
