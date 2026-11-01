"use client";
import {useState} from "react";
const keys=["objectives","flow","timing","capacity","trends"] as const;
type Key=typeof keys[number];
type Data={period:{name:string;team:string;status:string;startOn:string;endOn:string};provisional:boolean;source:string;snapshotVersion:number|null;goals:unknown;flow:unknown;timing:unknown;capacity:unknown;trends:unknown;events?:unknown;qualitative?:unknown;quality:{qualitativeLinks:string;events:string}};
type Indicator={id:string;tag:string;name:string;unit:string;source:string;value:string|null;available:boolean;reason:string|null};
const labels:Record<Key,string>={objectives:"Objectifs",flow:"Flux : comptes d'éléments",timing:"Durées moyennes (jours calendaires)",capacity:"Capacité (J/H)",trends:"Historique des périodes clôturées"};
function record(x:unknown):Record<string,unknown>{return x&&typeof x==="object"&&!Array.isArray(x)?x as Record<string,unknown>:{};}
function list(x:unknown):Record<string,unknown>[]{return Array.isArray(x)?x.filter(v=>v&&typeof v==="object").map(v=>record(v)):[];}
function value(x:unknown,unit=""){return x===null||x===undefined||x===""?"Non renseigné":String(x)+(unit?" "+unit:"");}
function metric(x:unknown,k:string){const v=record(x)[k];return value(v);}
export default function KanbanReportPreview({data,availableIndicators=[],preferredIndicatorIds=[],locale="fr"}:{data:Data;availableIndicators?:Indicator[];preferredIndicatorIds?:string[];locale?:"fr"|"en"}){
 const [selected,setSelected]=useState<Key[]>([...keys]),[show,setShow]=useState(false);
 const [chosenIndicators,setChosenIndicators]=useState<string[]>(preferredIndicatorIds);
 const local=(fr:string,en:string)=>locale==="fr"?fr:en;
 const reorderIndicator=(id:string,direction:number)=>setChosenIndicators(old=>{const next=[...old],i=next.indexOf(id),j=i+direction;if(i<0||j<0||j>=next.length)return old;[next[i],next[j]]=[next[j],next[i]];return next;});
 const [language,setLanguage]=useState<"fr"|"en">("fr");
 const [busy,setBusy]=useState(false),[exportError,setExportError]=useState("");
 async function freeze(){
  if(!selected.length||busy)return;
  setBusy(true);setExportError("");
  try{
   const path=window.location.pathname.replace(/\/report\/prepare\/?$/,"");
   const url=path.replace("/app/admin/kanban-periods/","/api/admin/kanban-periods/")+"/report-reference";
   const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({language,sections:selected,indicators:chosenIndicators.join(",")})});
   if(!response.ok)throw Error();
   const result=await response.json() as {id:string};
   window.location.assign(path+"/report/frozen?reference="+encodeURIComponent(result.id));
  }catch{setExportError("Impossible de figer le rapport. Vérifiez vos droits et les données enregistrées.");}
  finally{setBusy(false);}
 }
 const flow=record(data.flow),timing=record(data.timing),capacity=record(data.capacity);
 const objectives=list(data.goals),periods=list(data.trends);
 const field=(label:string,raw:unknown,unit="")=><div className="col-sm-6 col-xl-4"><dt className="small text-secondary">{label}</dt><dd className="fw-semibold">{value(raw,unit)}</dd></div>;
 const sections:Record<Key,React.ReactNode>={
  objectives:objectives.length?<ul className="list-group list-group-flush">{objectives.map((g,i)=><li className="list-group-item px-0" key={String(g.id??i)}><strong>{value(g.title)}</strong><span className="d-block small">{value(g.evaluation)}</span>{g.description!=null&&<p className="mb-0">{String(g.description)}</p>}</li>)}</ul>:<p className="text-secondary">Aucun objectif enregistré.</p>,
  flow:<dl className="row mb-0">{field("Éléments commencés",flow.started)}{field("Éléments terminés",flow.throughput)}{field("WIP final",flow.wip_final??flow.wipFinal)}</dl>,
  timing:<dl className="row mb-0">{field("Cycle Time",timing.cycle_days??record(timing.cycle).days,"j")}{field("Lead Time",timing.lead_days??record(timing.lead).days,"j")}{field("Convention Cycle Time",timing.cycle_convention??record(timing.cycle).convention)}{field("Convention Lead Time",timing.lead_convention??record(timing.lead).convention)}</dl>,
  capacity:<dl className="row mb-0">{field("Capacité initiale",capacity.initialJh??capacity.initial_jh,"J/H")}{field("Capacité réelle retenue",capacity.actualRetainedJh,"J/H")}{field("Référence réelle",capacity.actualReferenceJh,"J/H")}{field("Capacité manuelle",capacity.actualManualJh,"J/H")}{field("Écart",capacity.gapJh,"J/H")}{field("Source",capacity.actualSource??capacity.provenance)}</dl>,
  trends:periods.length?<div className="table-responsive"><table className="table table-sm"><thead><tr><th>Période</th><th>Commencés</th><th>Terminés</th><th>WIP</th><th>Cycle (j)</th><th>Lead (j)</th></tr></thead><tbody>{periods.map((p,i)=><tr key={String(p.id??i)}><th scope="row">{value(p.name)}</th><td>{value(p.started)}</td><td>{value(p.throughput)}</td><td>{value(p.wipFinal)}</td><td>{value(p.cycleDays)}</td><td>{value(p.leadDays)}</td></tr>)}</tbody></table></div>:<p className="text-secondary">Aucune période clôturée éligible.</p>
 };
 return <section className="smn-panel rounded-4 p-4">
  <h2 className="h5">Composition du rapport Kanban</h2>
  <p className="text-secondary small">Choisissez les rubriques à présenter. L&apos;aperçu HTML n&apos;archive aucun PDF.</p>
  <div className="row g-2">{keys.map(key=><label className="col-12 col-lg-6 form-check ms-3" key={key}><input className="form-check-input" type="checkbox" checked={selected.includes(key)} onChange={e=>setSelected(old=>e.target.checked?[...old,key]:old.filter(x=>x!==key))}/><span className="form-check-label">{labels[key]}</span></label>)}</div>
  <section className="border rounded-3 p-3 mt-3" aria-label="Indicateurs ponctuels Kanban"><h3 className="h6">{local("Indicateurs de ce rapport","Indicators for this report")}</h3><p className="small text-secondary">{local("Cette sélection et son ordre ne modifient pas les préférences permanentes.","This selection and its order do not change permanent preferences.")}</p>{availableIndicators.map(d=><div key={d.id} className="d-flex gap-2 align-items-center"><label className="flex-grow-1"><input type="checkbox" className="me-2" checked={chosenIndicators.includes(d.id)} onChange={e=>setChosenIndicators(old=>e.target.checked?[...old,d.id]:old.filter(v=>v!==d.id))}/>{d.tag} — {d.name} ({d.unit})</label>{chosenIndicators.includes(d.id)&&<><button type="button" className="btn btn-sm btn-outline-secondary" aria-label={local("Monter ","Move up ")+d.tag} onClick={()=>reorderIndicator(d.id,-1)}>↑</button><button type="button" className="btn btn-sm btn-outline-secondary" aria-label={local("Descendre ","Move down ")+d.tag} onClick={()=>reorderIndicator(d.id,1)}>↓</button></>}</div>)}</section>
  <div className="d-flex align-items-center gap-2 flex-wrap mt-3">
   <label htmlFor="kanban-report-language">Langue</label>
   <select id="kanban-report-language" className="form-select form-select-sm w-auto" value={language} onChange={e=>setLanguage(e.target.value as "fr"|"en")}><option value="fr">Français</option><option value="en">English</option></select>
   <button type="button" className="btn btn-primary btn-sm" disabled={busy||!selected.length} onClick={freeze}>{busy?"Enregistrement…":"Figer la préparation"}</button>
  </div>
  {exportError&&<p className="alert alert-warning mt-2" role="alert">{exportError}</p>}
  <button type="button" className="btn btn-outline-primary my-3" onClick={()=>setShow(v=>!v)} aria-expanded={show}>{show?"Masquer l'aperçu":"Afficher l'aperçu HTML"}</button>
  {show&&<div className="smn-report-printable"><article className="border rounded-3 p-4" aria-label="Aperçu HTML Kanban">
   <h2 className="h4">{data.period.name}</h2><p className="mb-1">{data.period.team} · {data.period.startOn} — {data.period.endOn}</p>
   <p className="small">{data.provisional?"Rapport provisoire":"Rapport clôturé · V"+data.snapshotVersion} · {data.period.status}</p>
   {chosenIndicators.length>0&&<section className="border-top pt-3 mb-3"><h3 className="h5">{local("Indicateurs sélectionnés","Selected indicators")}</h3><table className="table table-sm"><thead><tr><th>{local("Indicateur","Indicator")}</th><th>{local("Valeur","Value")}</th><th>{local("Provenance","Source")}</th></tr></thead><tbody>{chosenIndicators.map(id=>availableIndicators.find(d=>d.id===id)).filter((x):x is Indicator=>!!x).map(d=><tr key={d.id}><th title={d.name}>{d.tag} — {d.name}</th><td>{d.value===null?"—":d.value+" "+d.unit}</td><td>{d.source}{d.reason?" · "+d.reason:""}</td></tr>)}</tbody></table></section>}
   {selected.map(key=><section className="border-top pt-3 mb-3" key={key}><h3 className="h5">{labels[key]}</h3>{sections[key]}</section>)}
   <p className="small text-secondary border-top pt-2">Données absentes : non renseignées. Aucun indicateur en Story Points. Événements : {data.quality.events}. Liens qualitatifs : {data.quality.qualitativeLinks}.</p>
  </article></div>}
  <p className="text-secondary small mt-3">Export PDF Kanban non activé : il nécessite une référence de rendu figée et un archivage vérifié par le moteur commun.</p>
 </section>;
}
