"use client";
import {useMemo,useState} from "react";
import type {IndicatorView} from "./settings-tabs";
import {filterRecommendedIndicators,recommendedForMode,type RecommendedIndicator} from "@/lib/indicators/recommended-catalog";

type Team=Readonly<{id:string;name:string;mode:"scrum"|"kanban"}>;
export default function RecommendedIndicatorGuide({teams,teamId,view="cards"}:{teams:readonly Team[];teamId:string|null;view?:IndicatorView}){
 const [query,setQuery]=useState("");
 const [domain,setDomain]=useState("");
 const [type,setType]=useState("");
 const [copied,setCopied]=useState("");
 const [copyError,setCopyError]=useState("");
 const team=teams.find(t=>t.id===teamId);
 const all=useMemo(()=>team?recommendedForMode(team.mode):[],[team]);
 const domains=useMemo(()=>[...new Set(all.map(x=>x.domain))],[all]);
 const rows=useMemo(()=>filterRecommendedIndicators(all,query,domain,type),[all,query,domain,type]);
 const selectTeam=(id:string)=>{
  const next=teams.find(t=>t.id===id);
  if(!next)return;
  window.location.assign("/app/admin/settings/indicators?teamId="+encodeURIComponent(next.id)+"#indicateurs-recommandes");
 };
 async function copy(entry:RecommendedIndicator){
  const value=entry.formula??entry.suggestedTag;
  if(!value)return;
  try{await navigator.clipboard.writeText(value);setCopied(entry.id);setCopyError("");}
  catch{setCopied("");setCopyError("La copie a échoué. Sélectionnez le texte pour le copier manuellement.");}
 }
 return <section aria-label="Indicateurs recommandés" className="smn-panel rounded-4 p-3 smn-indicator-guide-panel">
  <h2 className="h5 mb-2">Indicateurs recommandés</h2>
  <p className="small text-secondary">Bibliothèque de référence pour configurer vos propres indicateurs dans le catalogue SMN v33. Les tags affichés sont des exemples : adaptez-les à vos définitions. Aucune création automatique.</p>
  <div className="row g-2 mb-3">
   <div className="col-md-5"><label htmlFor="recommended-team" className="form-label">Équipe</label>
    <select id="recommended-team" className="form-select" value={team?.id??""} onChange={e=>selectTeam(e.target.value)}>
     <option value="">Sélectionner une équipe</option>
     {teams.map(t=><option key={t.id} value={t.id}>{t.name} — {t.mode==="scrum"?"Scrum":"Kanban"}</option>)}
    </select>
   </div>
   {team&&<><div className="col-md-4"><label htmlFor="recommended-search" className="form-label">Rechercher</label>
    <input id="recommended-search" type="search" className="form-control" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom, tag, description"/></div>
   <div className="col-md-3"><label htmlFor="recommended-domain" className="form-label">Domaine</label>
    <select id="recommended-domain" className="form-select" value={domain} onChange={e=>setDomain(e.target.value)}><option value="">Tous les domaines</option>{domains.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
   <div className="col-md-3"><label htmlFor="recommended-type" className="form-label">Type</label>
    <select id="recommended-type" className="form-select" value={type} onChange={e=>setType(e.target.value)}><option value="">Saisis et calculés</option><option value="manual">Saisis</option><option value="computed">Calculés</option></select></div></>}
  </div>
  {!team?<div className="alert alert-info" role="status">Sélectionnez une équipe pour consulter ses recommandations Scrum ou Kanban.</div>:
   <>
    <p role="status" aria-live="polite" className="small text-secondary">{rows.length} indicateur(s) recommandé(s) · {team.mode==="scrum"?"Scrum":"Kanban"}</p>
    {copyError&&<p role="alert" className="text-danger small">{copyError}</p>}
    {rows.length===0&&<p role="status" className="alert alert-secondary">Aucun indicateur ne correspond aux filtres sélectionnés.</p>}
    {view==="list"?<div className="table-responsive"><table className="table table-hover align-middle smn-indicator-guide-table">
     <thead><tr><th scope="col">Indicateur</th><th scope="col">Domaine</th><th scope="col">Type</th><th scope="col">Tag / Expression</th><th scope="col">Unité</th><th scope="col">Détails</th></tr></thead>
     <tbody>{rows.map(entry=><tr key={entry.id}>
      <th scope="row">{entry.name}</th>
      <td>{entry.domain}</td>
      <td><span className="badge text-bg-secondary">{entry.type==="manual"?"Saisi":"Calculé"}</span></td>
      <td><div className="d-flex align-items-center gap-2"><code className="text-break">{entry.formula??entry.suggestedTag}</code>
       <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>void copy(entry)}>Copier</button></div>{copied===entry.id&&<span role="status" className="small text-success">Copié</span>}</td>
      <td>{entry.unit}</td>
      <td><details><summary className="btn btn-outline-secondary btn-sm">Voir la fiche</summary>
       <div className="small mt-2" style={{minWidth:220}}>
        <p><strong>Objectif :</strong> {entry.purpose}</p>
        <p><strong>Prérequis :</strong> {entry.type==="manual"?"Valeur à saisir":entry.prerequisites.length?entry.prerequisites.join(", "):"Données de capacité du rôle"}</p>
        <p><strong>Exemple :</strong> {entry.exampleInputs} → {entry.exampleResult}</p>
        <p><strong>Interprétation :</strong> {entry.interpretation}</p>
        <p><strong>Précaution :</strong> {entry.caveat}</p>
        <p><strong>Affichage :</strong> {entry.display}</p>
       </div>
      </details></td>
     </tr>)}</tbody>
    </table></div>:<div>
    {domains.filter(d=>rows.some(r=>r.domain===d)).map(d=><section key={d} aria-label={d} className="mb-4">
     <h3 className="h6 border-bottom pb-2 mb-3 smn-indicator-domain-title">{d}</h3>
     <div className="row g-3">{rows.filter(x=>x.domain===d).map(entry=><div key={entry.id} className="col-12 col-xl-6">
      <article className="border rounded-4 h-100 p-3 smn-indicator-guide-card">
       <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <h4 className="h6 mb-0">{entry.name}</h4>
        <span className="badge text-bg-secondary flex-shrink-0">{entry.type==="manual"?"Saisi":"Calculé"}</span>
       </div>
       <p className="small mb-2">{entry.purpose}</p>
       <p className="small mb-2"><strong>{entry.type==="manual"?"Tag conseillé":"Expression recommandée"} :</strong></p>
       <div className="d-flex gap-2 align-items-center flex-wrap mb-2">
        <code className="text-break flex-grow-1">{entry.formula??entry.suggestedTag}</code>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>void copy(entry)}>Copier</button>
       </div>
       {copied===entry.id&&<span className="text-success small" role="status">Copié</span>}
       {entry.type==="manual"?<p className="small text-secondary mb-2">À saisir dans le catalogue (ou à renseigner à partir d'une mesure externe).</p>:
        <p className="small mb-2"><strong>Prérequis :</strong> {entry.prerequisites.length?entry.prerequisites.join(", "):"Données de capacité associées au rôle sélectionné"}</p>}
       <p className="small mb-1"><strong>Exemple :</strong> {entry.exampleInputs} → <strong>{entry.exampleResult}</strong></p>
       <p className="small mb-1"><strong>Interprétation :</strong> {entry.interpretation}</p>
       <p className="small mb-1"><strong>Précaution :</strong> {entry.caveat}</p>
       <p className="small text-secondary mb-0"><strong>Unité :</strong> {entry.unit} · <strong>Affichage :</strong> {entry.display}</p>
      </article>
     </div>)}</div>
    </section>)}</div>}
   </>}
 </section>;
}
