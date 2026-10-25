"use client";
import {useState} from "react";
import type {ManagedBriefTemplate} from "@/server/ai-briefs/templates";
import {allowedBriefFields} from "@/lib/ai-brief-templates";

const fields=[...new Set([
 "cycle.name","cycle.dates","cycle.status","team.name","product.name","objectives","risks","dependencies","decisions",
 "scrum.storyPoints.committed","scrum.storyPoints.completed","scrum.capacity.planned","kanban.started","kanban.wip","kanban.throughput","kanban.cycleTime","kanban.leadTime","kanban.capacity.planned"
])];
const initial={title:"",description:"",sections:["Contexte"],questions:[],instructions:[],data:["cycle.name","team.name"],depth:2};
type Draft=typeof initial;
const lines=(v:string)=>v.split("\n").map(x=>x.trim()).filter(Boolean);
export default function TemplateEditor({original}:{original:ManagedBriefTemplate[]}){
 const [templates,setTemplates]=useState(original);
 const [selected,setSelected]=useState<string>("new");
 const current=templates.find(t=>t.id===selected);
 const [draft,setDraft]=useState<Draft>({...initial});
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const choose=(id:string)=>{
  setSelected(id);setMessage("");
  const found=templates.find(t=>t.id===id);
  setDraft(found?{title:found.title,description:found.description,sections:[...found.sections],questions:[...found.questions],instructions:[...found.instructions],data:[...found.data],depth:found.depth}:{...initial});
 };
 async function send(action:"create"|"update"|"activate"|"deactivate"){
  if(action==="deactivate"&&!window.confirm("Désactiver ce modèle ? Les briefs déjà archivés et leur origine resteront inchangés."))return;
  setBusy(true);setMessage("");
  try{
   const body=action==="create"?{action,template:draft}:{action,id:current?.id,revision:current?.revision,...(action==="update"?{template:draft}:{})};
   const res=await fetch("/api/admin/ai-briefs/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   if(!res.ok)throw Error((await res.json()).error??"Erreur");
   const loaded=await fetch("/api/admin/ai-briefs/templates");
   if(!loaded.ok)throw Error("Actualisation impossible");
   const json=await loaded.json() as {templates:ManagedBriefTemplate[]};
   setTemplates(json.templates);choose("new");
   setMessage("Modèle enregistré. Les archives existantes sont conservées.");
  }catch(e){setMessage(e instanceof Error?e.message:"Erreur");}
  finally{setBusy(false);}
 }
 return <div className="row g-3">
  <div className="col-12 col-lg-4"><label className="form-label" htmlFor="brief-template-choice">Modèle</label>
   <select id="brief-template-choice" className="form-select" value={selected} onChange={e=>choose(e.target.value)}>
    <option value="new">+ Nouveau modèle</option>
    {templates.map(t=><option key={t.id} value={t.id}>{t.title}{t.active?"":" (désactivé)"}{t.builtin?" — initial":""}</option>)}
   </select>
   {current?.builtin&&<p className="small text-secondary mt-2">Modèle initial protégé : créez un nouveau modèle pour le personnaliser.</p>}
  </div>
  <div className="col-12 col-lg-8">
   <fieldset disabled={busy||Boolean(current?.builtin)} className="d-grid gap-3">
    <div><label htmlFor="brief-name" className="form-label">Nom</label><input id="brief-name" className="form-control" maxLength={120} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></div>
    <div><label htmlFor="brief-description" className="form-label">Description</label><textarea id="brief-description" className="form-control" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></div>
    {(["sections","questions","instructions"] as const).map(key=><div key={key}><label htmlFor={"brief-"+key} className="form-label">{{sections:"Rubriques (une par ligne, ordre conservé)",questions:"Questions (une par ligne)",instructions:"Consignes (une par ligne)"}[key]}</label>
     <textarea id={"brief-"+key} rows={4} className="form-control" value={draft[key].join("\n")} onChange={e=>setDraft({...draft,[key]:lines(e.target.value)})}/></div>)}
    <div><label htmlFor="brief-depth" className="form-label">Profondeur d&apos;analyse (1 à 5)</label><input id="brief-depth" type="number" min={1} max={5} className="form-control" value={draft.depth} onChange={e=>setDraft({...draft,depth:Number(e.target.value)})}/></div>
    <div><p className="mb-1">Données collectives autorisées</p><div className="row g-2">
     {fields.map(field=><label className="col-12 col-md-6 form-check" key={field}><input className="form-check-input" type="checkbox" checked={draft.data.includes(field)} onChange={e=>setDraft({...draft,data:e.target.checked?[...draft.data,field]:draft.data.filter(x=>x!==field)})}/> <span className="form-check-label">{field}</span></label>)}
    </div><p className="small text-secondary mt-2">Scrum/Kanban : seuls les champs compatibles seront proposés. Les données individuelles sont interdites.</p></div>
   </fieldset>
   <div className="d-flex gap-2 mt-3 flex-wrap">
    {!current&&<button className="btn btn-primary" disabled={busy} onClick={()=>send("create")}>Créer le modèle</button>}
    {current&&!current.builtin&&<><button className="btn btn-primary" disabled={busy} onClick={()=>send("update")}>Enregistrer</button>
     <button className="btn btn-outline-secondary" disabled={busy} onClick={()=>send(current.active?"deactivate":"activate")}>{current.active?"Désactiver":"Réactiver"}</button></>}
   </div>
   {message&&<p className="mt-3" role="status">{message}</p>}
  </div>
 </div>;
}
