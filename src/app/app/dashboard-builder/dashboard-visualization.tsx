import type {ReactNode} from "react";
import type {VisualizationModel} from "@/server/dashboard-builder/visualizations";
import {formatIndicatorValue} from "@/lib/indicators/format-value";
import styles from "./dashboard-dimensions.module.css";

export type VisualizationLabels=Readonly<{
 nullValue:string;absent:string;error:string;noHistory:string;invalidBounds:string;incompatible:string;
}>;
export const FALLBACK_LABELS:VisualizationLabels={
 nullValue:"Non renseigné",absent:"Aucune donnée",error:"Erreur de chargement",
 noHistory:"Historique indisponible",invalidBounds:"Bornes de jauge invalides",
 incompatible:"Visualisation incompatible",
};
const format=(value:number,locale:string)=>formatIndicatorValue(value,locale.startsWith("fr")?"fr":"en");
const valueLabel=(value:number,unit:string|null|undefined,locale:string)=>
 format(value,locale)+(unit?" "+unit:"");

/** Pure presentation. All values originate in the authorized v33 producer. */
export function DashboardVisualization({model,locale="fr",labels=FALLBACK_LABELS}:{
 model:VisualizationModel;locale?:string;labels?:VisualizationLabels;
}):ReactNode{
 if(model.state!=="ready"){
  const messages:Record<Exclude<VisualizationModel["state"],"ready">,string>={
   null:labels.nullValue,absent:labels.absent,error:labels.error,"no-history":labels.noHistory,
   "invalid-bounds":labels.invalidBounds,incompatible:labels.incompatible,
  };
  return <span className={styles.state} role="status">{messages[model.state]}</span>;
 }
 if((model.kind==="number"||model.kind==="card")&&model.value!==undefined)
  return <div className={styles.metric}>
   <output className={styles.metricNumber}>{format(model.value,locale)}</output>
   {model.unit&&<span className={styles.metricUnit}>{model.unit}</span>}
  </div>;
 if(model.kind==="gauge"){
  if(model.ratio===undefined||model.value===undefined||!Number.isFinite(model.ratio)||model.ratio<0||model.ratio>1)
   return <span role="status" className={styles.state}>{labels.invalidBounds}</span>;
  return <div role="progressbar" aria-valuenow={model.ratio*100} aria-valuemin={0} aria-valuemax={100}
   aria-label={valueLabel(model.value,model.unit,locale)}>
   <div className={styles.metric}><output className={styles.metricNumber}>{format(model.value,locale)}</output>
    {model.unit&&<span className={styles.metricUnit}>{model.unit}</span>}</div>
   <div className={styles.progressTrack} aria-hidden="true"><div className={styles.progressFill} style={{width:`${model.ratio*100}%`}}/></div>
  </div>;
 }
 if(model.kind==="list")
  return <ul className={styles.businessList}>{(model.rows??[]).map((item,i)=>
   <li key={i} className={styles.businessItem}><strong>{item.label}</strong><span className={styles.businessItemMeta}>{item.value}</span></li>)}</ul>;
 if(model.kind==="text")return <p className="mb-0">{model.text??""}</p>;
 if(model.kind==="line"||model.kind==="bar"){
  const points=model.points??[];
  const values=points.map(p=>p.value).filter((v):v is number=>v!==null&&Number.isFinite(v));
  if(!values.length)return <span role="status" className={styles.state}>{labels.noHistory}</span>;
  const lo=Math.min(0,...values),hi=Math.max(0,...values),range=hi-lo||1;
  const plotLeft=42,plotRight=490,plotTop=18,plotBottom=155;
  const x=(i:number)=>plotLeft+(points.length===1?(plotRight-plotLeft)/2:i*(plotRight-plotLeft)/Math.max(1,points.length-1));
  const y=(v:number)=>plotBottom-(v-lo)*(plotBottom-plotTop)/range;
  const segments:{items:{x:number;y:number}[]}[]=[];
  let current:{x:number;y:number}[]=[];
  points.forEach((p,i)=>{if(p.value===null||!Number.isFinite(p.value)){if(current.length)segments.push({items:current});current=[];}
   else current.push({x:x(i),y:y(p.value)});});
  if(current.length)segments.push({items:current});
  const labelStep=Math.max(1,Math.ceil(points.length/6));
  return <figure className="m-0">
   <svg className={styles.chart} viewBox="0 0 520 190" role="img"
    aria-label={model.kind==="line"?"Courbe historique des indicateurs":"Histogramme historique des indicateurs"}>
    {[0,1,2,3,4].map(i=>{
     const value=lo+range*i/4,yy=y(value);
     return <g key={i}><line x1={plotLeft} x2={plotRight} y1={yy} y2={yy} className={styles.chartGrid}/>
      <text className={styles.chartLabel} textAnchor="end" x={plotLeft-7} y={yy+4}>{format(value,locale)}</text></g>;
    })}
    {model.kind==="line"?segments.map((segment,i)=>
     <polyline key={i} className={styles.chartStroke} points={segment.items.map(p=>`${p.x},${p.y}`).join(" ")}/>)
     :points.map((p,i)=>p.value===null?null:<rect key={i} className={styles.chartBar}
       x={x(i)-Math.min(14,170/points.length)} y={Math.min(y(p.value),y(0))}
       width={Math.min(28,340/points.length)} height={Math.max(1,Math.abs(y(p.value)-y(0)))}/>)}
    {model.kind==="line"&&segments.flatMap((segment,i)=>segment.items.map((p,j)=>
     <circle key={`${i}-${j}`} cx={p.x} cy={p.y} r="3" fill="var(--smn-surface)" stroke="var(--smn-brand)" strokeWidth="2"/>))}
    {points.map((p,i)=>i%labelStep===0||i===points.length-1?<text key={i}
     className={styles.chartLabel} x={x(i)} y="175" textAnchor="middle">{p.label}</text>:null)}
   </svg>
   <figcaption className="visually-hidden">{points.map(p=>`${p.label}: ${p.value===null?labels.nullValue:valueLabel(p.value,model.unit,locale)}`).join("; ")}</figcaption>
  </figure>;
 }
 return <span role="status" className={styles.state}>{labels.incompatible}</span>;
}
