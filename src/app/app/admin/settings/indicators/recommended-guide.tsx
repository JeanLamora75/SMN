"use client";
import {useMemo,useState} from "react";
import type {IndicatorView} from "./settings-tabs";
import {useLocale,useTranslation} from "@/i18n/client";
import {localizeRecommendedIndicator} from "@/lib/indicators/recommended-catalog.en";
import {filterRecommendedIndicators,recommendedForMode,type RecommendedIndicator} from "@/lib/indicators/recommended-catalog";

type Team=Readonly<{id:string;name:string;mode:"scrum"|"kanban"}>;
export default function RecommendedIndicatorGuide({teams,teamId,view="cards"}:{teams:readonly Team[];teamId:string|null;view?:IndicatorView}){
 const t=useTranslation(),locale=useLocale();
 const [query,setQuery]=useState("");
 const [domain,setDomain]=useState("");
 const [type,setType]=useState("");
 const [copied,setCopied]=useState("");
 const [copyError,setCopyError]=useState("");
 const team=teams.find(t=>t.id===teamId);
 const all=useMemo(()=>team?recommendedForMode(team.mode).map(entry=>localizeRecommendedIndicator(entry,locale)):[],[team,locale]);
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
  catch{setCopied("");setCopyError(t("indicatorSettingsUi.copyError"));}
 }
 return <section aria-label={t("indicatorSettingsUi.recommended")} className="smn-panel rounded-4 p-3 smn-indicator-guide-panel">
  <h2 className="h5 mb-2">{t("indicatorSettingsUi.recommended")}</h2>
  <p className="small text-secondary">{t("indicatorSettingsUi.recommendedIntro")}</p>
  <div className="row g-2 mb-3">
   <div className="col-12 col-md-6 col-xl-3"><label htmlFor="recommended-team" className="form-label">{t("indicatorSettingsUi.team")}</label>
    <select id="recommended-team" className="form-select" value={team?.id??""} onChange={e=>selectTeam(e.target.value)}>
     <option value="">{t("indicatorSettingsUi.selectTeam")}</option>
     {teams.map(t=><option key={t.id} value={t.id}>{t.name} — {t.mode==="scrum"?"Scrum":"Kanban"}</option>)}
    </select>
   </div>
   {team&&<><div className="col-12 col-md-6 col-xl-4"><label htmlFor="recommended-search" className="form-label">{t("indicatorSettingsUi.search")}</label>
    <input id="recommended-search" type="search" className="form-control" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("indicatorSettingsUi.recommendedPlaceholder")}/></div>
   <div className="col-12 col-md-6 col-xl-3"><label htmlFor="recommended-domain" className="form-label">{t("indicatorSettingsUi.domain")}</label>
    <select id="recommended-domain" className="form-select" value={domain} onChange={e=>setDomain(e.target.value)}><option value="">{t("indicatorSettingsUi.allDomains")}</option>{domains.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
   <div className="col-12 col-md-6 col-xl-2"><label htmlFor="recommended-type" className="form-label">{t("indicatorSettingsUi.type")}</label>
    <select id="recommended-type" className="form-select" value={type} onChange={e=>setType(e.target.value)}><option value="">{t("indicatorSettingsUi.allTypes")}</option><option value="manual">{t("indicatorSettingsUi.manualPlural")}</option><option value="computed">{t("indicatorSettingsUi.computedPlural")}</option></select></div></>}
  </div>
  {!team?<div className="alert alert-info" role="status">{t("indicatorSettingsUi.selectTeamHelp")}</div>:
   <>
    <p role="status" aria-live="polite" className="small text-secondary">{t("indicatorSettingsUi.recommendedCount",{count:rows.length,mode:team.mode==="scrum"?"Scrum":"Kanban"})}</p>
    {copyError&&<p role="alert" className="text-danger small">{copyError}</p>}
    {rows.length===0&&<p role="status" className="alert alert-secondary">{t("indicatorSettingsUi.noResults")}</p>}
    {view==="list"?<div className="table-responsive"><table className="table table-hover align-middle smn-indicator-guide-table">
     <thead><tr><th scope="col">{t("indicatorSettingsUi.indicator")}</th><th scope="col">{t("indicatorSettingsUi.domain")}</th><th scope="col">{t("indicatorSettingsUi.type")}</th><th scope="col">{t("indicatorSettingsUi.tagExpression")}</th><th scope="col">{t("indicatorSettingsUi.unit")}</th><th scope="col">{t("indicatorSettingsUi.details")}</th></tr></thead>
     <tbody>{rows.map(entry=><tr key={entry.id}>
      <th scope="row">{entry.name}</th>
      <td>{entry.domain}</td>
      <td><span className="badge text-bg-secondary">{t(entry.type==="manual"?"indicatorSettingsUi.manual":"indicatorSettingsUi.computed")}</span></td>
      <td><div className="d-flex align-items-center gap-2"><code className="text-break">{entry.formula??entry.suggestedTag}</code>
       <button type="button" className="btn btn-outline-primary btn-sm" onClick={()=>void copy(entry)}>{t("indicatorSettingsUi.copy")}</button></div>{copied===entry.id&&<span role="status" className="small text-success">{t("indicatorSettingsUi.copied")}</span>}</td>
      <td>{entry.unit}</td>
      <td><details><summary className="btn btn-outline-secondary btn-sm">{t("indicatorSettingsUi.viewDetails")}</summary>
       <div className="small mt-2" style={{minWidth:220}}>
        <p><strong>{t("indicatorSettingsUi.purpose")} :</strong> {entry.purpose}</p>
        <p><strong>{t("indicatorSettingsUi.prerequisites")} :</strong> {entry.type==="manual"?t("indicatorSettingsUi.enterValue"):entry.prerequisites.length?entry.prerequisites.join(", "):t("indicatorSettingsUi.roleCapacityData")}</p>
        <p><strong>{t("indicatorSettingsUi.example")} :</strong> {entry.exampleInputs} → {entry.exampleResult}</p>
        <p><strong>{t("indicatorSettingsUi.interpretation")} :</strong> {entry.interpretation}</p>
        <p><strong>{t("indicatorSettingsUi.caveat")} :</strong> {entry.caveat}</p>
        <p><strong>{t("indicatorSettingsUi.display")} :</strong> {entry.display}</p>
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
        <span className="badge text-bg-secondary flex-shrink-0">{t(entry.type==="manual"?"indicatorSettingsUi.manual":"indicatorSettingsUi.computed")}</span>
       </div>
       <p className="small mb-2">{entry.purpose}</p>
       <p className="small mb-2"><strong>{t(entry.type==="manual"?"indicatorSettingsUi.suggestedTag":"indicatorSettingsUi.recommendedExpression")} :</strong></p>
       <div className="d-flex gap-2 align-items-center flex-wrap mb-2">
        <code className="text-break flex-grow-1">{entry.formula??entry.suggestedTag}</code>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>void copy(entry)}>{t("indicatorSettingsUi.copy")}</button>
       </div>
       {copied===entry.id&&<span className="text-success small" role="status">{t("indicatorSettingsUi.copied")}</span>}
       {entry.type==="manual"?<p className="small text-secondary mb-2">{t("indicatorSettingsUi.manualHint")}</p>:
        <p className="small mb-2"><strong>{t("indicatorSettingsUi.prerequisites")} :</strong> {entry.prerequisites.length?entry.prerequisites.join(", "):t("indicatorSettingsUi.roleCapacityRequirements")}</p>}
       <p className="small mb-1"><strong>{t("indicatorSettingsUi.example")} :</strong> {entry.exampleInputs} → <strong>{entry.exampleResult}</strong></p>
       <p className="small mb-1"><strong>{t("indicatorSettingsUi.interpretation")} :</strong> {entry.interpretation}</p>
       <p className="small mb-1"><strong>{t("indicatorSettingsUi.caveat")} :</strong> {entry.caveat}</p>
       <p className="small text-secondary mb-0"><strong>{t("indicatorSettingsUi.unit")} :</strong> {entry.unit} · <strong>{t("indicatorSettingsUi.display")} :</strong> {entry.display}</p>
      </article>
     </div>)}</div>
    </section>)}</div>}
   </>}
 </section>;
}
