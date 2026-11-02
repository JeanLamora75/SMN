"use client";
import {useMemo} from "react";
import type {DashboardLayout,DashboardBlock,DashboardSlot} from "@/server/dashboard-builder/layout";
import type {BatchRequest} from "@/server/dashboard-builder/batch";
import {useDashboardBatch} from "./use-dashboard-batch";
import {DashboardVisualization} from "./dashboard-visualization";
import type {VisualizationModel} from "@/server/dashboard-builder/visualizations";
import {getDashboardTemplate} from "@/lib/dashboard-builder/templates";

function hasContent(slot:DashboardSlot):boolean{
 return typeof slot.source==="string"&&slot.source.length>0&&
        typeof slot.view==="string"&&slot.view.length>0;
}
export function visibleSlots(block:DashboardBlock){
 return block.slots.filter(hasContent);
}
export function gridColumns(block:DashboardBlock):string{
 const template=getDashboardTemplate(block.templateId,block.templateVersion);
 if(!template)return "minmax(0,1fr)";
 const active=template.slots.filter(cell=>block.slots.some(s=>s.templateSlotId===cell.slotId&&hasContent(s)));
 return active.length?active.map(cell=>`${cell.columnSpan}fr`).join(" "):"minmax(0,1fr)";
}
export default function DashboardConsultation({layout,teamId,cycleId,locale="fr"}:{
 layout:DashboardLayout;teamId:string;cycleId:string|null;locale?:string;
}){
 const requests=useMemo<BatchRequest[]>(()=>[...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)]
  .flatMap(block=>visibleSlots(block).map(slot=>({
   id:slot.id,source:slot.source!,view:slot.view!,cycleId,filters:slot.filters,
  }))),[layout,cycleId]);
 const {slots,refresh}=useDashboardBatch(teamId,cycleId,requests);
 const renderBlock=(block:DashboardBlock)=>{
  const active=visibleSlots(block);
  if(!active.length)return null;
  return <section key={block.id} className="smn-panel p-3" aria-label="Bloc du tableau de bord">
   <div style={{display:"grid",gridTemplateColumns:gridColumns(block),gap:"1rem"}}>
    {active.map(slot=>{
     const result=slots[slot.id];
     let model:VisualizationModel;
     if(!result||result.state==="loading")return <section key={slot.id} aria-busy="true" aria-label="Chargement de la donnée" className="p-2"><span role="status">Chargement…</span></section>;
     if(result.state==="available"){
      const number=Number(result.value);
      model=Number.isFinite(number)?{state:"ready",kind:slot.view as VisualizationModel["kind"],value:number,unit:result.unit}:
       {state:"error",kind:slot.view as VisualizationModel["kind"]};
     }else if(result.state==="null"||result.state==="absent"||result.state==="error"){
      model={state:result.state,kind:slot.view as VisualizationModel["kind"]};
     }else model={state:"incompatible",kind:slot.view as VisualizationModel["kind"]};
     return <section key={slot.id} className="p-2" aria-label={slot.source}>
      <DashboardVisualization model={model} locale={locale}/>
     </section>;
    })}
   </div>
  </section>;
 };
 const header=layout.header.blocks.map(renderBlock).filter(Boolean);
 const rows=layout.rows.map(row=>row.blocks.map(renderBlock).filter(Boolean)).filter(row=>row.length);
 return <main className="smn-dashboard-builder" aria-label="Dashboard personnalisé">
  <div className="d-flex align-items-center justify-content-between mb-3">
   <h1 className="h4 mb-0">Tableau de bord</h1>
   <button className="btn btn-outline-secondary" type="button" onClick={refresh}>Actualiser</button>
  </div>
  {header.length>0&&<div className="row g-3 mb-3">{header.map((block,i)=>
   <div className="col-12 col-lg-6" key={i}>{block}</div>)}</div>}
  {rows.length>0?rows.map((row,i)=><div className="row g-3 mb-3" key={i}>
   {row.map((block,j)=><div className="col-12 col-lg" key={j}>{block}</div>)}
  </div>):<section className="smn-panel p-4" role="status">
   <p className="mb-0">Aucune donnée configurée pour ce tableau de bord.</p>
  </section>}
 </main>;
}
