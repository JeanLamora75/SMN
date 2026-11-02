"use client";
import {useMemo,useState} from "react";
import {DashboardBusinessList} from "./dashboard-business-list";
import OperationalQuickAdd from "../operational-quick-add";
import Link from "next/link";
import type {DashboardCycle} from "@/server/dashboard-builder/cycles";
import type {DashboardLayout,DashboardBlock,DashboardSlot} from "@/server/dashboard-builder/layout";
import type {BatchRequest} from "@/server/dashboard-builder/batch";
import {useDashboardBatch} from "./use-dashboard-batch";
import {DashboardVisualization} from "./dashboard-visualization";
import type {VisualizationModel} from "@/server/dashboard-builder/visualizations";
import {getDashboardTemplate} from "@/lib/dashboard-builder/templates";
import styles from "./dashboard-dimensions.module.css";
import {visibleSlots,gridColumns} from "@/lib/dashboard-builder/consultation-layout";
export {visibleSlots,gridColumns} from "@/lib/dashboard-builder/consultation-layout";
import type {CSSProperties} from "react";

function templateCellStyle(template:ReturnType<typeof getDashboardTemplate>,slot:DashboardSlot):CSSProperties {
 const cell=template?.slots.find(c=>c.slotId===slot.templateSlotId);
 return cell?{gridColumn:`${cell.column+1} / span ${cell.columnSpan}`,gridRow:`${cell.row+1} / span ${cell.rowSpan}`,minWidth:0}:{};
}
export default function DashboardConsultation({layout,teamId,navigation,mode,locale="fr",personalizing=false,canManage=false}:{
 layout:DashboardLayout;teamId:string;navigation:{current:DashboardCycle|null;previous:string|null;next:string|null};
 mode:"scrum"|"kanban";locale?:string;personalizing?:boolean;canManage?:boolean;
}){
 const cycleId=navigation.current?.id??null;
 const [pages,setPages]=useState<Record<string,number>>({});
 const cycleLink=(id:string)=>`/app/dashboard-builder?teamId=${encodeURIComponent(teamId)}&cycleId=${encodeURIComponent(id)}`;
 const date=(value:string)=>new Intl.DateTimeFormat(locale,{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));
 const requests=useMemo<BatchRequest[]>(()=>[...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)]
  .flatMap(block=>visibleSlots(block).map(slot=>({
   id:slot.id,source:slot.source!,view:slot.view!,cycleId:slot.filters?.cycleIdOverride as string|undefined ?? cycleId,
   filters:slot.view==="list"?{...slot.filters,offset:(pages[slot.id]??0)*(Number(slot.filters?.limit) || 10)}:slot.filters,
  }))),[layout,cycleId,pages]);
 const {slots,refresh,retry}=useDashboardBatch(teamId,cycleId,requests);
 const renderBlock=(block:DashboardBlock)=>{
  const active=visibleSlots(block);
  if(!active.length)return null;
  const template=getDashboardTemplate(block.templateId,block.templateVersion);
  const dimensions=block.dimensions;
  return <section key={block.id} className="smn-panel p-3" aria-label="Bloc du tableau de bord">
   <div className={`${styles.innerSlots} ${styles.fixedContent}`} style={{gridTemplateColumns:`repeat(${template?.columns??1},minmax(0,1fr))`,gridTemplateRows:`repeat(${template?.rows??1},minmax(0,auto))`,height:dimensions?.height==="auto"?undefined:dimensions?.height}}>
    {active.map(slot=>{
     const result=slots[slot.id];
     let model:VisualizationModel;
     if(!result||result.state==="loading")return <section key={slot.id} style={templateCellStyle(template,slot)} aria-busy="true" aria-label="Chargement de la donnée" className="p-2"><div className="placeholder-glow" role="status" aria-label="Chargement en cours"><span className="placeholder col-12 rounded mb-2"/><span className="placeholder col-7 rounded"/></div></section>;
     if(result.state==="available"&&result.list)return <section key={slot.id} style={templateCellStyle(template,slot)} className="p-2" aria-label={slot.source}>
      {canManage&&mode==="scrum"&&cycleId&&!personalizing&&["calendar:ceremonies","notes:sprint"].includes(slot.source??"")&&<div className="mb-2"><OperationalQuickAdd kind={slot.source==="notes:sprint"?"notes":"events"} teamId={teamId} cycleId={cycleId} label={slot.source==="notes:sprint"?"+ Ajouter une note":"+ Ajouter un événement"} onSaved={refresh}/></div>}
      <DashboardBusinessList data={result.list} page={pages[slot.id]??0}
       onNext={()=>setPages(p=>({...p,[slot.id]:(p[slot.id]??0)+1}))}
       onPrevious={()=>setPages(p=>({...p,[slot.id]:Math.max(0,(p[slot.id]??0)-1)}))}/>
     </section>;
     if(result.state==="available"){
      const number=result.value===undefined||result.value===null?NaN:Number(result.value);
      model=Number.isFinite(number)?{state:"ready",kind:slot.view as VisualizationModel["kind"],value:number,unit:result.unit}:
       {state:"error",kind:slot.view as VisualizationModel["kind"]};
     }else if(result.state==="null"||result.state==="absent"||result.state==="error"){
      model={state:result.state,kind:slot.view as VisualizationModel["kind"]};
     }else model={state:"incompatible",kind:slot.view as VisualizationModel["kind"]};
     return <section key={slot.id} style={templateCellStyle(template,slot)} className="p-2" aria-label={slot.source}>
      {result.state==="absent"&&slot.view==="list"?<p role="status">Aucun résultat</p>:result.state==="unavailable"||result.state==="incompatible"?<p role="status" className="text-body-secondary">{result.state==="unavailable"?"Source indisponible":"Source incompatible"}</p>:
       <DashboardVisualization model={model} locale={locale}/>}
      {model.state==="error"&&<button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={()=>retry(slot.id)}>Réessayer cet emplacement</button>}
     </section>;
    })}
   </div>
  </section>;
 };
 const header=layout.header.blocks.map(renderBlock).filter(Boolean);
 const rows=layout.rows.map(row=>row.blocks.map(block=>({block,content:renderBlock(block)})).filter(item=>item.content)).filter(row=>row.length);
 return <main className="smn-dashboard-builder" aria-label="Dashboard personnalisé">
  <div className="d-flex align-items-center justify-content-between mb-3">
   <h1 className="h4 mb-0">Tableau de bord</h1>
   <button className="btn btn-outline-secondary" type="button" onClick={refresh}>Actualiser</button>
  </div>
  <section className="smn-panel p-3 mb-3" aria-label="Cycle actif">
   <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
    <div className="d-flex align-items-center gap-2">
     {navigation.previous&&!personalizing?<Link aria-label="Cycle précédent" href={cycleLink(navigation.previous)} className="btn btn-outline-secondary">◀</Link>:
      <button type="button" aria-label="Cycle précédent" className="btn btn-outline-secondary" disabled>◀</button>}
     <div className="text-center"><strong>{navigation.current?.name??(mode==="scrum"?"Aucun sprint":"Aucune période")}</strong>
      {navigation.current&&<div className="small text-body-secondary">{date(navigation.current.startAt)} — {date(navigation.current.endAt)}</div>}</div>
     {navigation.next&&!personalizing?<Link aria-label="Cycle suivant" href={cycleLink(navigation.next)} className="btn btn-outline-secondary">▶</Link>:
      <button type="button" aria-label="Cycle suivant" className="btn btn-outline-secondary" disabled>▶</button>}
    </div>
    {navigation.current&&<span className="badge text-bg-secondary">{navigation.current.status}</span>}
   </div>
  </section>
  {header.length>0&&<div className="row g-3 mb-3">{header.map((block,i)=>
   <div className="col-12 col-lg-6" key={i}>{block}</div>)}</div>}
  {rows.length>0?rows.map((row,i)=><div className={`${styles.blockRow} mb-3`} key={i}>
   {row.map(({block,content})=><div className={styles.blockCell} key={block.id} style={{"--smn-block-width":block.dimensions?.width??1} as CSSProperties}>{content}</div>)}
  </div>):<section className="smn-panel p-4" role="status">
   <p className="mb-0">Aucune donnée configurée pour ce tableau de bord.</p>
  </section>}
 </main>;
}
