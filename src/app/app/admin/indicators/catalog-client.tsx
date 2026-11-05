"use client";
import {useCallback,useEffect,useState} from "react";
import {createPortal} from "react-dom";
import {useDashboardModalFocus} from "../../dashboard-builder/modal-focus";
import ui from "./indicator-definition-modal.module.css";
import SettingsTabs from "../settings/settings-tabs";
import FormulaPublicationEditor from "./formula-publication-editor";
import DashboardSlotEditor from "./dashboard-slot-editor";
import IndicatorCycles from "./indicator-cycles";
import {useTranslation} from "@/i18n/client";
type D={id:string;tag:string;name:string;description:string;indicator_type:"manual"|"computed";formula:string|null;archived_at:string|null;unit_name:string;unit_short:string;color:string|null;icon:string|null};
type P={indicator_id:string;screen_key:string;is_visible:boolean;display_order:number;display_style:string};
type Data={definitions:D[];selections:{indicator_id:string;is_active:boolean}[];preferences:P[]};
const screens=["dashboard","cycle_list","cycle_detail","trends","reports"];
export default function IndicatorCatalog({teams,isAdmin,scope="team",activeTeamId,cycleType="scrum",locale="fr"}:{teams:{id:string;name:string}[];isAdmin:boolean;scope?:"team"|"global";activeTeamId?:string;cycleType?:"scrum"|"kanban";locale?:"fr"|"en"}){
 const t=useTranslation(),[team,setTeam]=useState(activeTeamId??teams[0]?.id??""),[data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[search,setSearch]=useState(""),[filter,setFilter]=useState("all"),[edit,setEdit]=useState<D|null>(null),[create,setCreate]=useState(false);
 const [tag,setTag]=useState(""),[name,setName]=useState(""),[kind,setKind]=useState("manual"),[formula,setFormula]=useState(""),[description,setDescription]=useState("");
 const [unitName,setUnitName]=useState(""),[unitShort,setUnitShort]=useState(""),[color,setColor]=useState(""),[icon,setIcon]=useState("");
 const load=useCallback(async()=>{try{const r=await fetch("/api/admin/indicators/catalog"+(team?"?teamId="+encodeURIComponent(team):""),{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error);setData(j);setError("");}catch(e){setError(String(e));}},[team]);
 useEffect(()=>{void Promise.resolve().then(()=>load());},[load]);
 async function send(command:Record<string,unknown>){setBusy(true);setError("");try{const r=await fetch("/api/admin/indicators/catalog",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(command)});const j=await r.json();if(!r.ok)throw Error(j.error);await load();return true;}catch(e){setError(String(e));return false;}finally{setBusy(false);}}
 const closeEditor=()=>{if(busy)return;setCreate(false);setEdit(null);setError("");};
 const modalFocus=useDashboardModalFocus(closeEditor,scope==="global"&&isAdmin&&(create||edit!==null));
 function editor(d?:D){setError("");setCreate(!d);setEdit(d??null);setTag(d?.tag??"");setName(d?.name??"");setKind(d?.indicator_type??"manual");setFormula(d?.formula??"");setDescription(d?.description??"");setUnitName(d?.unit_name??"");setUnitShort(d?.unit_short??"");setColor(d?.color??"");setIcon(d?.icon??"");}
 const selections=new Map(data?.selections.map(x=>[x.indicator_id,x.is_active]));
 const prefs=new Map(data?.preferences.map(x=>[x.indicator_id+":"+x.screen_key,x]));
 const defs=(data?.definitions??[]).filter(d=>(filter==="all"||filter==="active"&&!d.archived_at||filter==="archived"&&d.archived_at)&&[d.tag,d.name].some(v=>v.toLowerCase().includes(search.toLowerCase())));
 const teamSelector=scope==="team"?<></>:<label className="form-label">{t("indicators.team")}<select className="form-select mt-1" value={team} onChange={e=>setTeam(e.target.value)}>{teams.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>;
 return <div>
  {error&&<div role="alert" className="alert alert-danger">{t("indicators.error")}: {error} <button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>void load()}>{t("indicators.retry")}</button></div>}
  <SettingsTabs label={t("indicators.title")} variant={scope==="team"?"cockpit":"default"} sections={[
   ...(scope==="team"?[{id:"cycles",label:t("indicators.navTitle"),content:<IndicatorCycles teamId={team} cycleType={cycleType} locale={locale}/>}]:[]),
   ...(scope==="global"?[{id:"catalog",label:t("indicators.catalog"),content:<section>
    <div className="d-flex flex-wrap gap-2 justify-content-between mb-3"><input aria-label={t("indicators.search")} placeholder={t("indicators.search")} type="search" className="form-control w-auto" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label={t("indicators.filter")} className="form-select w-auto" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{t("indicators.all")}</option><option value="active">{t("indicators.active")}</option><option value="archived">{t("indicators.archived")}</option></select>{isAdmin&&<button type="button" className="btn btn-primary" onClick={()=>editor()}>{t("indicators.create")}</button>}</div>
    <div className="smn-panel rounded-4 p-3 table-responsive smn-indicator-global-list"><table className="table table-hover align-middle smn-indicator-guide-table"><thead><tr><th>{t("indicators.tag")}</th><th>{t("indicators.name")}</th><th>{t("indicators.type")}</th><th>{t("indicators.actions")}</th></tr></thead><tbody>{defs.map(d=><tr key={d.id}><th scope="row">{d.tag}</th><td>{d.name}{d.archived_at&&<span className="badge text-bg-secondary ms-2">{t("indicators.archived")}</span>}</td><td>{t(d.indicator_type==="manual"?"indicators.manual":"indicators.computed")}</td><td>{isAdmin&&!d.archived_at&&<div className="d-flex gap-2"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={()=>editor(d)}>{t("indicators.edit")}</button><button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={()=>{if(window.confirm(t("indicators.confirmArchive")))void send({action:"archive",indicatorId:d.id});}}>{t("indicators.archive")}</button></div>}</td></tr>)}</tbody></table>{defs.length===0&&<p role="status">{t("indicators.empty")}</p>}</div>
    <div className="smn-indicator-global-cards">
     <div className="row g-3">{defs.map(d=><div className="col-12 col-lg-6 col-xxl-4" key={d.id}>
      <article className="smn-panel rounded-4 p-3 h-100 smn-indicator-guide-card d-flex flex-column">
       <div className="d-flex align-items-start justify-content-between gap-2">
        <h3 className="h6 mb-1">{d.name}</h3>
        <span className="badge text-bg-secondary">{t(d.indicator_type==="manual"?"indicators.manual":"indicators.computed")}</span>
       </div>
       <p className="mb-2"><code>{d.tag}</code>{d.archived_at&&<span className="badge text-bg-secondary ms-2">{t("indicators.archived")}</span>}</p>
       {d.description&&<p className="small text-secondary mb-2">{d.description}</p>}
       {d.unit_short&&<p className="small mb-2"><strong>{t("indicators.unit")} :</strong> {d.unit_short}</p>}
       {d.indicator_type==="computed"&&d.formula&&<p className="small mb-2 text-break"><strong>{t("indicators.formula")} :</strong> <code>{d.formula}</code></p>}
       {isAdmin&&!d.archived_at&&<div className="d-flex flex-wrap gap-2 mt-auto pt-2">
        <button type="button" className="btn btn-sm btn-outline-primary" disabled={busy} onClick={()=>editor(d)}>{t("indicators.edit")}</button>
        <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={()=>{if(window.confirm(t("indicators.confirmArchive")))void send({action:"archive",indicatorId:d.id});}}>{t("indicators.archive")}</button>
       </div>}
      </article>
     </div>)}</div>
     {defs.length===0&&<p role="status">{t("indicators.empty")}</p>}
    </div>
   </section>}]:[]),
   ...(scope==="team"?[{id:"selections",label:t("indicators.selections"),content:<section>{teamSelector}<div className="smn-panel rounded-4 p-3 table-responsive"><table className="table"><thead><tr><th>{t("indicators.tag")}</th><th>{t("indicators.name")}</th><th>{t("indicators.selected")}</th></tr></thead><tbody>{data?.definitions.map(d=><tr key={d.id}><th>{d.tag}</th><td>{d.name}</td><td><input type="checkbox" className="form-check-input" aria-label={t("indicators.selected")+" "+d.tag} checked={selections.get(d.id)??false} disabled={busy||!!d.archived_at||!team} onChange={e=>void send({action:"selection",teamId:team,indicatorId:d.id,active:e.target.checked})}/></td></tr>)}</tbody></table></div></section>},
   {id:"preferences",label:t("indicators.preferences"),content:<section>{teamSelector}{screens.map(screen=><details key={screen} open={screen==="cycle_list"?true:undefined} className="smn-panel rounded-4 p-3 mb-3"><summary className="h6 mb-2" style={{cursor:"pointer"}}>{t(("indicators.screen."+screen) as "indicators.screen.dashboard")}</summary>{screen==="dashboard"&&team&&<DashboardSlotEditor teamId={team} definitions={(data?.definitions??[]).filter(d=>selections.get(d.id))}/>}<div className="table-responsive"><table className="table"><thead><tr><th>{t("indicators.tag")}</th><th>{t("indicators.visible")}</th><th>{t("indicators.order")}</th><th>{t("indicators.style")}</th></tr></thead><tbody>{data?.definitions.filter(d=>selections.get(d.id)).map((d,i)=>{const p=prefs.get(d.id+":"+screen);const save=(patch:Record<string,unknown>)=>void send({action:"preference",teamId:team,indicatorId:d.id,screenKey:screen,visible:p?.is_visible??true,order:p?.display_order??i,style:p?.display_style??"number",...patch});return <tr key={d.id}><th>{d.tag}</th><td><input type="checkbox" className="form-check-input" aria-label={t("indicators.visible")+" "+d.tag} checked={p?.is_visible??true} disabled={busy} onChange={e=>save({visible:e.target.checked})}/></td><td><input type="number" min={0} max={100000} className="form-control" style={{width:95}} aria-label={t("indicators.order")+" "+d.tag} key={d.id+screen+p?.display_order} defaultValue={p?.display_order??i} onBlur={e=>{const n=Number(e.target.value);if(Number.isSafeInteger(n)&&n>=0&&n!==(p?.display_order??i))save({order:n});}}/></td><td><select className="form-select" aria-label={t("indicators.style")+" "+d.tag} value={p?.display_style??"number"} onChange={e=>save({style:e.target.value})}>{["number","card","gauge","line","bar"].map(style=><option key={style} value={style}>{t(("indicators.display."+style) as "indicators.display.number")}</option>)}</select></td></tr>;})}</tbody></table></div></details>)}</section>}]:[])
  ]}/>
  {scope==="global"&&isAdmin&&(create||edit)&&createPortal(<div className={ui.overlay} role="presentation">
   <div ref={modalFocus} tabIndex={-1} className={ui.dialog} role="dialog" aria-modal="true" aria-labelledby="indicator-definition-modal-title" aria-describedby="indicator-definition-modal-subtitle">
    <header className={ui.header}>
     <div>
      <div className={ui.eyebrow}>Cockpit Agile · Administration des indicateurs</div>
      <h2 id="indicator-definition-modal-title" className={ui.title}>{t(create?"indicators.create":"indicators.edit")}</h2>
      <p id="indicator-definition-modal-subtitle" className={ui.subtitle}>Définissez les propriétés de cet indicateur dans le catalogue global.</p>
     </div>
     <button type="button" className={ui.close} onClick={closeEditor} disabled={busy} aria-label="Fermer">×</button>
    </header>
    <div className={ui.body}>
     {error&&<div role="alert" className="alert alert-danger">{t("indicators.error")}: {error}</div>}
     <form id="indicator-definition-form" className="row g-3" onSubmit={async e=>{e.preventDefault();const ok=await send(create?{action:"create",tag,name,indicatorType:kind,description,unitName,unitShort,color:color||null,icon:icon||null,...(kind==="computed"?{formula}:{})}:{action:"edit",indicatorId:edit?.id,name,description,unitName,unitShort,color:color||null,icon:icon||null});if(ok){setCreate(false);setEdit(null);}}}><label className="form-label d-block">{t("indicators.name")}<input data-initial-focus="true" className="form-control" value={name} maxLength={160} required onChange={e=>setName(e.target.value)}/></label>{create&&<><label className="form-label d-block">{t("indicators.tag")}<input className="form-control" value={tag} required pattern="[A-Z][A-Z0-9_]*" onChange={e=>setTag(e.target.value.toUpperCase())}/></label><label className="form-label d-block">{t("indicators.type")}<select className="form-select" value={kind} onChange={e=>setKind(e.target.value)}><option value="manual">{t("indicators.manual")}</option><option value="computed">{t("indicators.computed")}</option></select></label>{kind==="computed"&&<div><label className="form-label d-block">{t("indicators.formula")}<textarea className="form-control" required value={formula} onChange={e=>setFormula(e.target.value)}/></label><a className="btn btn-outline-secondary btn-sm mb-3" href="/app/admin/settings/indicators#guide-expressions" target="_blank" rel="noopener noreferrer">Consulter le guide des expressions</a></div>}</>}<label className="form-label d-block">{t("indicators.description")}<textarea className="form-control" value={description} onChange={e=>setDescription(e.target.value)}/></label><div className="row g-2">
 <label className="col-md-3 form-label">{t("indicators.unit")}<input className="form-control" value={unitName} maxLength={80} onChange={e=>setUnitName(e.target.value)}/></label>
 <label className="col-md-3 form-label">{t("indicators.shortUnit")}<input className="form-control" value={unitShort} maxLength={20} onChange={e=>setUnitShort(e.target.value)}/></label>
 <label className="col-md-3 form-label">{t("indicators.color")}<input className="form-control" value={color} placeholder="#336699" pattern="#[0-9a-fA-F]{6}" onChange={e=>setColor(e.target.value)}/></label>
 <label className="col-md-3 form-label">{t("indicators.icon")}<input className="form-control" value={icon} maxLength={80} onChange={e=>setIcon(e.target.value)}/></label>
 </div></form>
     {edit?.indicator_type==="computed"&&edit.formula!==null&&<FormulaPublicationEditor key={edit.id+edit.formula} indicatorId={edit.id} initialFormula={edit.formula} onPublished={async()=>{await load();closeEditor();}}/>}
    </div>
    <footer className={ui.footer}>
     <span className="small text-body-secondary">Les changements seront enregistrés après validation.</span>
     <div className="d-flex gap-2">
      <button type="button" className="btn btn-outline-secondary" onClick={closeEditor} disabled={busy}>{t("indicators.cancel")}</button>
      <button type="submit" form="indicator-definition-form" className="btn btn-primary" disabled={busy}>{busy?"Enregistrement…":t("indicators.save")}</button>
     </div>
    </footer>
   </div>
  </div>,document.body)}
 </div>;
}
