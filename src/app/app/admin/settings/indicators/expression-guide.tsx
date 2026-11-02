"use client";
import {useMemo,useState} from "react";

type Entry={name:string;category:"Calcul"|"Historique"|"Capacité";description:string;example:string;available:boolean};
const catalog:Entry[]=[
 {name:"MIN(A, B)",category:"Calcul",description:"Renvoie la plus petite valeur des arguments.",example:"MIN(12, 8)",available:true},
 {name:"MAX(A, B)",category:"Calcul",description:"Renvoie la plus grande valeur des arguments.",example:"MAX(12, 8)",available:true},
 {name:"ROUND(VALEUR, N)",category:"Calcul",description:"Arrondit une valeur à N décimales (de 0 à 24).",example:"ROUND(25 / 3, 2)",available:true},
 {name:"Opérateurs",category:"Calcul",description:"Addition +, soustraction -, multiplication *, division /, puissance ^ et pourcentage %.",example:"(POINTS_FAITS / POINTS_PREVUS) * 100",available:true},
 {name:"SUM_LAST(TAG, X)",category:"Historique",description:"Somme sur les X derniers cycles, cycle sélectionné inclus.",example:"SUM_LAST(SP_TERMINES, 5)",available:true},
 {name:"AVG_LAST(TAG, X)",category:"Historique",description:"Moyenne sur les X derniers cycles.",example:"AVG_LAST(SP_TERMINES, 5)",available:true},
 {name:"MIN_LAST(TAG, X)",category:"Historique",description:"Plus petite valeur sur les X derniers cycles.",example:"MIN_LAST(SP_TERMINES, 5)",available:true},
 {name:"MAX_LAST(TAG, X)",category:"Historique",description:"Plus grande valeur sur les X derniers cycles.",example:"MAX_LAST(SP_TERMINES, 5)",available:true},
 {name:"PREVIOUS(TAG, X)",category:"Historique",description:"Valeur du cycle X positions avant le cycle sélectionné.",example:"PREVIOUS(SP_TERMINES, 1)",available:true},
 {name:"DELTA(TAG, X)",category:"Historique",description:"Écart absolu avec la valeur du cycle précédent choisi.",example:"DELTA(SP_TERMINES, 1)",available:true},
 {name:"DELTA_PCT(TAG, X)",category:"Historique",description:"Écart relatif en pourcentage ; indisponible si la base vaut zéro.",example:"DELTA_PCT(SP_TERMINES, 1)",available:true},
 {name:"LAST_VALUES(TAG, X)",category:"Historique",description:"Renvoie une série datée, réservée aux visualisations compatibles (pas un nombre).",example:"LAST_VALUES(SP_TERMINES, 5)",available:true},
 {name:"ROLE_MAX_JH(ROLE)",category:"Capacité",description:"J/H théoriques du rôle après contributions, avant absences.",example:'ROLE_MAX_JH("DEVELOPER")',available:false},
 {name:"ROLE_JH_PLANNED(ROLE)",category:"Capacité",description:"J/H du rôle après absences planifiées uniquement.",example:'ROLE_JH_PLANNED("DEVELOPER")',available:false},
 {name:"ROLE_JH(ROLE)",category:"Capacité",description:"J/H du rôle après toutes les absences.",example:'ROLE_JH("DEVELOPER")',available:false}
];
export default function ExpressionGuide(){
 const [query,setQuery]=useState(""),[category,setCategory]=useState("Toutes"),[copied,setCopied]=useState("");
 const rows=useMemo(()=>catalog.filter(item=>(category==="Toutes"||item.category===category)&&
  `${item.name} ${item.description} ${item.example}`.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))),[query,category]);
 return <section aria-label="Guide des expressions" className="smn-panel rounded-4 p-3">
  <h2 className="h5">Guide des expressions</h2>
  <p className="text-secondary small">Les exemples de tags doivent être remplacés par les tags de votre catalogue. Les expressions annoncées « En préparation » ne sont pas utilisables.</p>
  <div className="row g-2 mb-3"><div className="col-md-8"><label htmlFor="expression-search" className="form-label">Rechercher</label><input id="expression-search" className="form-control" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Fonction, exemple ou description"/></div>
  <div className="col-md-4"><label htmlFor="expression-category" className="form-label">Catégorie</label><select id="expression-category" className="form-select" value={category} onChange={e=>setCategory(e.target.value)}>{["Toutes","Calcul","Historique","Capacité"].map(v=><option key={v}>{v}</option>)}</select></div></div>
  <p aria-live="polite" className="small text-secondary">{rows.length} expression(s)</p>
  <div className="row g-3">{rows.map(entry=><div className="col-12 col-xl-6" key={entry.name}><article className="border rounded-3 h-100 p-3">
   <div className="d-flex gap-2 justify-content-between align-items-start"><h3 className="h6 text-break">{entry.name}</h3><span className={entry.available?"badge text-bg-secondary":"badge text-bg-warning"}>{entry.available?entry.category:"En préparation"}</span></div>
   <p className="small">{entry.description}</p><div className="d-flex gap-2 align-items-center flex-wrap"><code className="text-break flex-grow-1">{entry.example}</code>
   <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!entry.available} onClick={()=>{void navigator.clipboard.writeText(entry.example).then(()=>setCopied(entry.name)).catch(()=>setCopied(""));}}>Copier</button></div>
   {copied===entry.name&&<span role="status" className="small text-success">Exemple copié</span>}
  </article></div>)}</div>
 </section>;
}
