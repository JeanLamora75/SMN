"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {DashboardBusinessList} from "./dashboard-business-list";
import {SMNIcon} from "../smn-icon";
import {isDashboardIcon} from "@/lib/dashboard-builder/icon-catalog";
import {ceremonyIconColorHex} from "@/lib/ceremony-appearance";
import OperationalQuickAdd from "../operational-quick-add";
import Link from "next/link";
import type {DashboardCycle} from "@/server/dashboard-builder/cycles";
import type {DashboardLayout,DashboardBlock,DashboardSlot} from "@/server/dashboard-builder/layout";
import type {BatchRequest} from "@/server/dashboard-builder/batch";
import {useDashboardBatch} from "./use-dashboard-batch";
import {DashboardVisualization} from "./dashboard-visualization";
import type {VisualizationModel} from "@/server/dashboard-builder/visualizations";
import {getDashboardTemplate} from "@/lib/dashboard-builder/templates";
import {resolveTachometerRatio} from "@/lib/dashboard-builder/tachometer";
import styles from "./dashboard-dimensions.module.css";
import {visibleSlots,gridColumns} from "@/lib/dashboard-builder/consultation-layout";
export {visibleSlots,gridColumns} from "@/lib/dashboard-builder/consultation-layout";
import type {CSSProperties,ReactNode} from "react";

const isWatermarkView=(view:unknown)=>view==="card-watermark"||view==="list-watermark";
function DashboardWatermark({slot}:{slot:DashboardSlot}){
 const node=useRef<HTMLSpanElement>(null);
 const [size,setSize]=useState<number|undefined>();
 useEffect(()=>{
  const parent=node.current?.parentElement;
  if(!parent)return;
  const update=()=>setSize(Math.max(0,Math.floor(Math.min(parent.clientHeight,parent.clientWidth)*.9)));
  update();
  const observer=new ResizeObserver(update);
  observer.observe(parent);
  return ()=>observer.disconnect();
 },[]);
 if(!isWatermarkView(slot.view)||!isDashboardIcon(slot.icon))return null;
 return <span ref={node} className={styles.watermarkGraphic} aria-hidden="true" style={{color:ceremonyIconColorHex(slot.iconColor)??"currentColor"}}>
  <SMNIcon name={slot.icon} size={size?size+"px":undefined}/>
 </span>;
}

function tachometerModel(value:number,unit:string|null|undefined,filters?:Record<string,unknown>):VisualizationModel {
 if(!Number.isFinite(value))return {state:"error",kind:"tachometer"};
 const ratio=resolveTachometerRatio(value,filters?.minimum,filters?.maximum);
 const minimum=filters?.minimum,maximum=filters?.maximum;
 const outOfRange=typeof minimum==="number"&&typeof maximum==="number"&&
  Number.isFinite(minimum)&&Number.isFinite(maximum)&&minimum<maximum&&
  (value<minimum||value>maximum);
 return ratio===null
  ?{state:"invalid-bounds",kind:"tachometer",value,unit,label:outOfRange?"out-of-scale":undefined}
  :{state:"ready",kind:"tachometer",value,unit,ratio};
}

function templateCellStyle(template:ReturnType<typeof getDashboardTemplate>,slot:DashboardSlot):CSSProperties {
 const cell=template?.slots.find(c=>c.slotId===slot.templateSlotId);
 return cell?{gridColumn:`${cell.column+1} / span ${cell.columnSpan}`,gridRow:`${cell.row+1} / span ${cell.rowSpan}`,minWidth:0}:{};
}
export default function DashboardConsultation({layout,teamId,teamName,navigation,mode,locale="fr",personalizing=false,canManage=false,headerActions}:{
 layout:DashboardLayout;teamId:string;teamName?:string|null;navigation:{current:DashboardCycle|null;previous:string|null;next:string|null};
 mode:"scrum"|"kanban";locale?:string;personalizing?:boolean;canManage?:boolean;headerActions?:ReactNode;
}){
 const cycleId=navigation.current?.id??null;
 const cycleLink=(id:string)=>`/app/dashboard-builder?teamId=${encodeURIComponent(teamId)}&cycleId=${encodeURIComponent(id)}`;
 const date=(value:string)=>new Intl.DateTimeFormat(locale,{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value));
 const requests=useMemo<BatchRequest[]>(()=>[...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)]
  .flatMap(block=>visibleSlots(block).map(slot=>({
   id:slot.id,source:slot.source!,view:slot.view!,cycleId:slot.filters?.cycleIdOverride as string|undefined ?? cycleId,
   filters:slot.filters,
  }))),[layout,cycleId]);
 const {slots,refresh,retry}=useDashboardBatch(teamId,cycleId,requests);
 const renderBlock=(block:DashboardBlock,headerMode=false)=>{
  const active=visibleSlots(block);
  if(!active.length)return null;
  const template=getDashboardTemplate(block.templateId,block.templateVersion);
  const dimensions=block.dimensions;
  const complete=!!template&&active.length===template.slotCount;
  return <section key={block.id} className={styles.blockPanel} aria-label={block.title?.trim()||"Bloc du tableau de bord"}>
   {(block.title?.trim()||isDashboardIcon(block.icon))&&<h2 className={styles.blockHeading}>{isDashboardIcon(block.icon)&&<span className="me-2" style={{color:ceremonyIconColorHex(block.iconColor)??"inherit"}}><SMNIcon name={block.icon}/></span>}{block.title?.trim()}</h2>}
   <div className={`${styles.innerSlots} ${styles.fixedContent}`} style={{gridTemplateColumns:`repeat(${complete?template.columns:Math.max(1,active.length)},minmax(0,1fr))`,gridTemplateRows:complete?`repeat(${template.rows},minmax(0,auto))`:"auto",height:headerMode?undefined:dimensions?.height==="auto"?undefined:dimensions?.height}}>
    {active.map(slot=>{
     const result=slots[slot.id];
     let model:VisualizationModel;
     if(!result||result.state==="loading")return <section key={slot.id} style={complete?templateCellStyle(template,slot):{minWidth:0}} aria-busy="true" aria-label="Chargement de la donnée" className={`${styles.slotCard} ${isWatermarkView(slot.view)?styles.watermarkSlot:""}`}><DashboardWatermark slot={slot}/>{(slot.title?.trim()||(!isWatermarkView(slot.view)&&isDashboardIcon(slot.icon)))&&<h3 className={styles.slotTitle}>{!isWatermarkView(slot.view)&&isDashboardIcon(slot.icon)&&<span className={styles.slotTitleIcon} style={{color:ceremonyIconColorHex(slot.iconColor)??"inherit"}}><SMNIcon name={slot.icon}/></span>}<span className={styles.slotTitleLabel}>{slot.title?.trim()}</span></h3>}<div className="placeholder-glow" role="status" aria-label="Chargement en cours"><span className="placeholder col-12 rounded mb-2"/><span className="placeholder col-7 rounded"/></div></section>;
     if(result.list&&(result.state==="available"||result.state==="absent"))return <section key={slot.id} style={complete?templateCellStyle(template,slot):{minWidth:0}} className={`${styles.slotCard} ${isWatermarkView(slot.view)?styles.watermarkSlot:""}`} aria-label={slot.title?.trim()||"Liste du tableau de bord"}><DashboardWatermark slot={slot}/>
      {(slot.title?.trim()||(!isWatermarkView(slot.view)&&isDashboardIcon(slot.icon)))&&<h3 className={styles.slotTitle}>{!isWatermarkView(slot.view)&&isDashboardIcon(slot.icon)&&<span className={styles.slotTitleIcon} style={{color:ceremonyIconColorHex(slot.iconColor)??"inherit"}}><SMNIcon name={slot.icon}/></span>}<span className={styles.slotTitleLabel}>{slot.title?.trim()}</span></h3>}
      <DashboardBusinessList data={result.list} locale={locale} columns={Array.isArray(slot.filters?.columns)?slot.filters.columns as string[]:undefined}/>
      {canManage&&mode==="scrum"&&cycleId&&!personalizing&&navigation.current?.status!=="closed"&&
       (slot.source==="calendar:ceremonies"||slot.source==="notes:sprint"||
        (slot.source==="registry:items"&&["all","risk","obstacle"].includes(String(slot.filters?.type??"all"))))&&
       <div className="border-top mt-3 pt-2 text-center">
        {slot.source==="registry:items"&&(!slot.filters?.type||slot.filters.type==="all")?<div className="d-flex flex-wrap justify-content-center gap-3">
         <OperationalQuickAdd kind="risks" teamId={teamId} cycleId={String(slot.filters?.cycleIdOverride??cycleId??"")} label="+ Ajouter un risque" onSaved={refresh}/>
         <OperationalQuickAdd kind="obstacles" teamId={teamId} cycleId={String(slot.filters?.cycleIdOverride??cycleId??"")} label="+ Ajouter un obstacle" onSaved={refresh}/>
        </div>:<OperationalQuickAdd
         kind={slot.source==="notes:sprint"?"notes":slot.source==="calendar:ceremonies"?"events":slot.filters?.type==="risk"?"risks":"obstacles"}
         teamId={teamId}
         cycleId={String(slot.filters?.cycleIdOverride??cycleId??"")}
         label={slot.source==="notes:sprint"?"+ Ajouter une note":slot.source==="calendar:ceremonies"?"+ Ajouter un événement":slot.filters?.type==="risk"?"+ Ajouter un risque":"+ Ajouter un obstacle"}
         onSaved={refresh}/>}
       </div>}
     </section>;
     if(result.state==="available"){
      const number=result.value===undefined||result.value===null?NaN:Number(result.value);
      model=(slot.view==="tachometer"||slot.view==="battery-horizontal"||slot.view==="battery-vertical")?{...tachometerModel(number,result.unit,slot.filters),kind:slot.view as VisualizationModel["kind"]}:slot.view==="gauge"?{state:"invalid-bounds",kind:"gauge"}:result.points&&(["line","bar","bar-horizontal"].includes(slot.view!))?{state:"ready",kind:slot.view as VisualizationModel["kind"],points:result.points,unit:result.unit}:Number.isFinite(number)?{state:"ready",kind:slot.view as VisualizationModel["kind"],value:number,unit:result.unit}:
       {state:"error",kind:slot.view as VisualizationModel["kind"]};
     }else if(result.state==="null"||result.state==="absent"||result.state==="error"){
      model={state:result.state,kind:slot.view as VisualizationModel["kind"]};
     }else model={state:"incompatible",kind:slot.view as VisualizationModel["kind"]};
     return <section key={slot.id} style={complete?templateCellStyle(template,slot):{minWidth:0}} className={`${styles.slotCard} ${styles.indicatorSlotCard} ${isWatermarkView(slot.view)?styles.watermarkSlot:""}`} aria-label={slot.title?.trim()||"Indicateur du tableau de bord"}><DashboardWatermark slot={slot}/>
      {(slot.title?.trim()||(!isWatermarkView(slot.view)&&isDashboardIcon(slot.icon)))&&<h3 className={styles.slotTitle}>{!isWatermarkView(slot.view)&&isDashboardIcon(slot.icon)&&<span className={styles.slotTitleIcon} style={{color:ceremonyIconColorHex(slot.iconColor)??"inherit"}}><SMNIcon name={slot.icon}/></span>}<span className={styles.slotTitleLabel}>{slot.title?.trim()}</span></h3>}
      {result.state==="absent"&&(slot.view==="list"||slot.view==="list-watermark")?<p role="status">Aucun résultat</p>:result.state==="unavailable"||result.state==="incompatible"?<p role="status" className="text-body-secondary">{result.state==="unavailable"?"Source indisponible":"Source incompatible"}</p>:
       <DashboardVisualization model={model} locale={locale}/>}
      {model.state==="error"&&<button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={()=>retry(slot.id)}>Réessayer cet emplacement</button>}
     </section>;
    })}
   </div>
  </section>;
 };
 const header=layout.header.blocks.map(block=>renderBlock(block,true)).filter(Boolean);
 const rows=layout.rows.map(row=>row.blocks.map(block=>({block,content:renderBlock(block)})).filter(item=>item.content)).filter(row=>row.length);
 return <div className="smn-dashboard-builder" aria-label="Dashboard personnalisé">
  <header className={styles.cockpitHeader} aria-label="En-tête du tableau de bord">
   <div className={styles.cockpitLayout}>
    <div>
     {teamName&&<div className={styles.cockpitMeta}>Équipe : {teamName}</div>}
     <div className={styles.cockpitNav}>
      {navigation.previous&&!personalizing?<Link aria-label="Sprint précédent" href={cycleLink(navigation.previous)} className={styles.cycleLink}>‹</Link>:
       <button type="button" aria-label="Sprint précédent" className={styles.cycleLink} disabled>‹</button>}
      <div>
       <h1 className={styles.cockpitTitle}>{navigation.current?.name??(mode==="scrum"?"Aucun sprint":"Aucune période")}</h1>
       {navigation.current&&<div className={styles.cockpitMeta}>{date(navigation.current.startAt)} — {date(navigation.current.endAt)}</div>}
      </div>
      {navigation.next&&!personalizing?<Link aria-label="Sprint suivant" href={cycleLink(navigation.next)} className={styles.cycleLink}>›</Link>:
       <button type="button" aria-label="Sprint suivant" className={styles.cycleLink} disabled>›</button>}
     </div>
     {navigation.current&&<span className={`${styles.cockpitBadge} mt-2`}>{({closed:"Clôturé",completed:"Terminé",active:"En cours",in_progress:"En cours",planned:"Planifié"} as Record<string,string>)[navigation.current.status]??navigation.current.status}</span>}
    </div>
    <div className={styles.headerKpis}>{header}</div>
    <div className={styles.cockpitActions}>
     {headerActions}
     <button className={styles.headerButton} type="button" onClick={refresh}><span aria-hidden="true">↻</span> Actualiser</button>
    </div>
   </div>
  </header>
  {rows.length>0?rows.map((row,i)=><div className={`${styles.blockRow} mb-3`} key={i}>
   {row.map(({block,content})=><div className={styles.blockCell} key={block.id} data-width={block.dimensions?.width??1} style={{"--smn-block-width":block.dimensions?.width??1} as CSSProperties}>{content}</div>)}
  </div>):<section className="smn-panel p-4" role="status">
   <p className="mb-0">Aucune donnée configurée pour ce tableau de bord.</p>
  </section>}
 </div>;
}
