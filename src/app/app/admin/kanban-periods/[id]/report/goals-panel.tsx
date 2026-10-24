"use client";
import {useEffect,useState} from "react";
type Goal={id:string;title:string;description:string;evaluation:"not_evaluated"|"achieved"|"partially_achieved"|"not_achieved";comment:string|null;revision:number;updatedAt:string};
const choices=[["not_evaluated","Non évalué"],["achieved","Atteint"],["partially_achieved","Partiellement atteint"],["not_achieved","Non atteint"]] as const;
export default function KanbanGoalsPanel({periodId,canManage,closed}:{periodId:string;canManage:boolean;closed:boolean}){
 const [goals,setGoals]=useState<Goal[]>([]);
 const [draft,setDraft]=useState<{id?:string;revision?:number;title:string;description:string;evaluation:Goal["evaluation"];comment:string}>({title:"",description:"",evaluation:"not_evaluated",comment:""});
 const [error,setError]=useState("");const [notice,setNotice]=useState("");const [busy,setBusy]=useState(false);
 const url="/api/admin/kanban-periods/"+encodeURIComponent(periodId)+"/goals";
 async function refresh(){const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw Error();const data=await r.json();setGoals(data.goals);}
 useEffect(()=>{let live=true;fetch(url,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(live)setGoals(d.goals);}).catch(()=>{if(live)setError("Objectifs indisponibles.");});return()=>{live=false;};},[url]);
 function edit(g:Goal){setDraft({id:g.id,revision:g.revision,title:g.title,description:g.description,evaluation:g.evaluation,comment:g.comment??""});setNotice("");}
 async function save(){
  if(!draft.title.trim()||closed||!canManage)return;
  setBusy(true);setError("");setNotice("");
  try{const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...draft,comment:draft.comment||null})});
   if(!r.ok){setError(r.status===409?"Modification refusée : période clôturée ou données actualisées.":"Enregistrement impossible.");return;}
   await refresh();setDraft({title:"",description:"",evaluation:"not_evaluated",comment:""});setNotice("Objectif enregistré et historisé.");
  }catch{setError("Enregistrement impossible.");}finally{setBusy(false);}
 }
 return <div>
  {error&&<p role="alert" className="alert alert-warning">{error}</p>}
  {notice&&<p role="status" className="alert alert-success">{notice}</p>}
  {goals.length===0&&<p className="text-secondary">Aucun objectif enregistré.</p>}
  {goals.map(g=><div key={g.id} className="border rounded p-3 mb-2">
   <div className="d-flex justify-content-between flex-wrap gap-2"><strong>{g.title}</strong><span>{choices.find(x=>x[0]===g.evaluation)?.[1]}</span></div>
   {g.description&&<p className="mb-1">{g.description}</p>}
   {g.comment&&<p className="small text-secondary mb-1">Évaluation : {g.comment}</p>}
   <small className="text-secondary">Dernière modification : {g.updatedAt}</small>
   {canManage&&!closed&&<button className="btn btn-sm btn-outline-primary ms-3" type="button" onClick={()=>edit(g)}>Modifier</button>}
  </div>)}
  {canManage&&!closed&&<div className="border rounded p-3 mt-3">
   <h3 className="h6">{draft.id?"Modifier l’objectif":"Ajouter un objectif"}</h3>
   <label className="form-label d-block">Titre<input className="form-control" maxLength={240} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
   <label className="form-label d-block">Description<textarea className="form-control" maxLength={4000} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
   {draft.id&&<label className="form-label d-block">Évaluation<select className="form-select" value={draft.evaluation} onChange={e=>setDraft({...draft,evaluation:e.target.value as Goal["evaluation"]})}>{choices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
   <label className="form-label d-block">Commentaire facultatif<textarea className="form-control" maxLength={2000} value={draft.comment} onChange={e=>setDraft({...draft,comment:e.target.value})}/></label>
   <button className="btn btn-primary" type="button" disabled={busy||!draft.title.trim()} onClick={save}>Enregistrer l’objectif</button>
   {draft.id&&<button className="btn btn-outline-secondary ms-2" onClick={()=>setDraft({title:"",description:"",evaluation:"not_evaluated",comment:""})}>Annuler</button>}
  </div>}
 </div>;
}
