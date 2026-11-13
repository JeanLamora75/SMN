"use client";
import {useMemo,useState} from "react";
import type {IndicatorView} from "./settings-tabs";
import {useLocale,useTranslation} from "@/i18n/client";

type Entry={name:string;category:"Calcul"|"Historique"|"Capacité";description:string;example:string;available:boolean};
const catalog:Entry[]=[
 {name:"MIN(A, B)",category:"Calcul",description:"Renvoie la plus petite valeur des arguments.",example:"MIN(12, 8)",available:true},
 {name:"MAX(A, B)",category:"Calcul",description:"Renvoie la plus grande valeur des arguments.",example:"MAX(12, 8)",available:true},
 {name:"ROUND(VALEUR, N)",category:"Calcul",description:"Arrondit une valeur à N décimales (de 0 à 24).",example:"ROUND(25 / 3, 2)",available:true},
 {name:"Opérateurs",category:"Calcul",description:"Addition +, soustraction -, multiplication *, division /, puissance ^ et pourcentage %.",example:"(POINTS_FAITS / POINTS_PREVUS) * 100",available:true},
 {name:"SUM_LAST(TAG, X)",category:"Historique",description:"Somme sur les X derniers cycles, cycle sélectionné inclus.",example:"SUM_LAST(SP_TERMINES, 5)",available:true},
 {name:"AVG_WEEK_LAST(TAG, X)",category:"Historique",description:"Somme des valeurs du tag divisée par la durée cumulée des X derniers cycles en semaines proratisées (jours calendaires / 7), cycle sélectionné inclus. Valeur absente ou durée invalide : indisponible.",example:"AVG_WEEK_LAST(SP_TERMINES, 3)",available:true},
 {name:"AVG_LAST(TAG, X)",category:"Historique",description:"Moyenne sur les X derniers cycles.",example:"AVG_LAST(SP_TERMINES, 5)",available:true},
 {name:"MIN_LAST(TAG, X)",category:"Historique",description:"Plus petite valeur sur les X derniers cycles.",example:"MIN_LAST(SP_TERMINES, 5)",available:true},
 {name:"MAX_LAST(TAG, X)",category:"Historique",description:"Plus grande valeur sur les X derniers cycles.",example:"MAX_LAST(SP_TERMINES, 5)",available:true},
 {name:"PREVIOUS(TAG, X)",category:"Historique",description:"Valeur du cycle X positions avant le cycle sélectionné.",example:"PREVIOUS(SP_TERMINES, 1)",available:true},
 {name:"DELTA(TAG, X)",category:"Historique",description:"Écart absolu avec la valeur du cycle précédent choisi.",example:"DELTA(SP_TERMINES, 1)",available:true},
 {name:"DELTA_PCT(TAG, X)",category:"Historique",description:"Écart relatif en pourcentage ; indisponible si la base vaut zéro.",example:"DELTA_PCT(SP_TERMINES, 1)",available:true},
 {name:"LAST_VALUES(TAG, X)",category:"Historique",description:"Renvoie une série datée, réservée aux visualisations compatibles (pas un nombre).",example:"LAST_VALUES(SP_TERMINES, 5)",available:true},
 {name:"ROLE_MAX_JH(ROLE)",category:"Capacité",description:"J/H théoriques du rôle après contributions, avant absences.",example:'ROLE_MAX_JH("DEVELOPER")',available:true},
 {name:"ROLE_JH_PLANNED(ROLE)",category:"Capacité",description:"J/H du rôle après absences planifiées uniquement.",example:'ROLE_JH_PLANNED("DEVELOPER")',available:true},
 {name:"ROLE_JH(ROLE)",category:"Capacité",description:"J/H du rôle après toutes les absences.",example:'ROLE_JH("DEVELOPER")',available:true}
];
const englishDescriptions=["Returns the smallest argument value.","Returns the largest argument value.","Rounds a value to N decimal places (0–24).","Addition +, subtraction -, multiplication *, division /, exponentiation ^ and percentage %.","Sum over the last X cycles, including the selected cycle.","Sum of tag values divided by the combined duration of the last X cycles in prorated weeks (calendar days / 7), including the selected cycle. Missing value or invalid duration: unavailable.","Average over the last X cycles.","Smallest value in the last X cycles.","Largest value in the last X cycles.","Value from X cycles before the selected cycle.","Absolute difference from the chosen previous cycle.","Relative percentage change; unavailable if the reference value is zero.","Returns a dated series for compatible visualizations (not a scalar).","Theoretical person-days for a role after contributions, before absences.","Role person-days after planned absences only.","Role person-days after all recorded absences."];
export default function ExpressionGuide({view="cards"}:{view?:IndicatorView}){
 const t=useTranslation(),locale=useLocale();
 const [query,setQuery]=useState(""),[category,setCategory]=useState("all"),[copied,setCopied]=useState("");
 const categoryLabels:{[key:string]:string}={all:t("indicatorSettingsUi.all"),Calcul:t("indicatorSettingsUi.calculation"),Historique:t("indicatorSettingsUi.history"),Capacité:t("indicatorSettingsUi.capacity")};
 const localized=useMemo(()=>catalog.map((item,index)=>({...item,description:locale==="en"?englishDescriptions[index]:item.description})),[locale]);
 const rows=useMemo(()=>localized.filter(item=>(category==="all"||item.category===category)&&
  `${item.name} ${item.description} ${item.example}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale))),[query,category,locale,localized]);
 return <section aria-label={t("indicatorSettingsUi.expressions")} className="smn-panel rounded-4 p-3 smn-indicator-guide-panel">
  <h2 className="h5">{t("indicatorSettingsUi.expressions")}</h2>
  <p className="text-secondary small">{t("indicatorSettingsUi.expressionsIntro")}</p>
  <div className="row g-2 mb-3"><div className="col-md-8"><label htmlFor="expression-search" className="form-label">{t("indicatorSettingsUi.search")}</label><input id="expression-search" className="form-control" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("indicatorSettingsUi.expressionsPlaceholder")}/></div>
  <div className="col-md-4"><label htmlFor="expression-category" className="form-label">{t("indicatorSettingsUi.category")}</label><select id="expression-category" className="form-select" value={category} onChange={e=>setCategory(e.target.value)}>{["all","Calcul","Historique","Capacité"].map(v=><option key={v} value={v}>{categoryLabels[v]}</option>)}</select></div></div>
  <p aria-live="polite" className="small text-secondary">{t("indicatorSettingsUi.expressionsCount",{count:rows.length})}</p>
  {view==="list"?<div className="table-responsive"><table className="table table-hover align-middle smn-indicator-guide-table">
   <thead><tr><th scope="col">{t("indicatorSettingsUi.expression")}</th><th scope="col">{t("indicatorSettingsUi.category")}</th><th scope="col">{t("indicatorSettingsUi.utility")}</th><th scope="col">{t("indicatorSettingsUi.example")}</th><th scope="col">{t("indicatorSettingsUi.actions")}</th></tr></thead>
   <tbody>{rows.map(entry=><tr key={entry.name}><th scope="row"><code>{entry.name}</code></th><td><span className="badge text-bg-secondary">{categoryLabels[entry.category]}</span></td>
    <td>{entry.description}</td><td><code className="text-break">{entry.example}</code></td>
    <td><button type="button" className="btn btn-outline-primary btn-sm" disabled={!entry.available} onClick={()=>{void navigator.clipboard.writeText(entry.example).then(()=>setCopied(entry.name)).catch(()=>setCopied(""));}}>{t("indicatorSettingsUi.copy")}</button>{copied===entry.name&&<span role="status" className="small text-success ms-2">{t("indicatorSettingsUi.copied")}</span>}</td>
   </tr>)}</tbody>
  </table></div>:<div className="row g-3">{rows.map(entry=><div className="col-12 col-xl-6" key={entry.name}><article className="border rounded-4 h-100 p-3 smn-indicator-guide-card">
   <div className="d-flex gap-2 justify-content-between align-items-start"><h3 className="h6 text-break">{entry.name}</h3><span className={entry.available?"badge text-bg-secondary":"badge text-bg-warning"}>{entry.available?categoryLabels[entry.category]:t("indicatorSettingsUi.comingSoon")}</span></div>
   <p className="small">{entry.description}</p><div className="d-flex gap-2 align-items-center flex-wrap"><code className="text-break flex-grow-1">{entry.example}</code>
   <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!entry.available} onClick={()=>{void navigator.clipboard.writeText(entry.example).then(()=>setCopied(entry.name)).catch(()=>setCopied(""));}}>{t("indicatorSettingsUi.copy")}</button></div>
   {copied===entry.name&&<span role="status" className="small text-success">{t("indicatorSettingsUi.exampleCopied")}</span>}
  </article></div>)}</div>}
 </section>;
}
