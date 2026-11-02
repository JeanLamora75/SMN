import type {CSSProperties,ReactNode} from "react";
import type {VisualizationModel} from "@/server/dashboard-builder/visualizations";

export type VisualizationLabels=Readonly<{
 nullValue:string;absent:string;error:string;noHistory:string;invalidBounds:string;incompatible:string;
}>;
export const FALLBACK_LABELS:VisualizationLabels={
 nullValue:"Non renseigné",absent:"Aucune donnée",error:"Erreur de chargement",
 noHistory:"Historique indisponible",invalidBounds:"Bornes de jauge invalides",
 incompatible:"Visualisation incompatible",
};
const format=(value:number,locale:string)=>new Intl.NumberFormat(locale,{maximumFractionDigits:3}).format(value);
const valueLabel=(value:number,unit:string|null|undefined,locale:string)=>
 format(value,locale)+(unit?" "+unit:"");
const chartStyle:CSSProperties={display:"block",width:"100%",maxWidth:560,height:"auto"};
/** Pure, theme-inheriting presentation; never fetches or recalculates source values. */
export function DashboardVisualization({model,locale="fr",labels=FALLBACK_LABELS}:{
 model:VisualizationModel;locale?:string;labels?:VisualizationLabels;
}):ReactNode{
 if(model.state!=="ready"){
  const message:Record<Exclude<VisualizationModel["state"],"ready">,string>={
   null:labels.nullValue,absent:labels.absent,error:labels.error,"no-history":labels.noHistory,
   "invalid-bounds":labels.invalidBounds,incompatible:labels.incompatible,
  };
  return <span role="status">{message[model.state]}</span>;
 }
 if((model.kind==="number"||model.kind==="card")&&model.value!==undefined)
  return <output>{valueLabel(model.value,model.unit,locale)}</output>;
 if(model.kind==="gauge"&&model.ratio!==undefined&&model.value!==undefined)
  return <div role="progressbar" aria-valuenow={model.ratio*100} aria-valuemin={0} aria-valuemax={100}
    aria-label={valueLabel(model.value,model.unit,locale)}>
    <div aria-hidden="true" style={{height:12,border:"1px solid currentColor",borderRadius:6,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${model.ratio*100}%`,background:"currentColor"}}/>
    </div>
    <output>{valueLabel(model.value,model.unit,locale)}</output>
  </div>;
 if(model.kind==="list"){
  return <table><tbody>{(model.rows??[]).map((row,index)=><tr key={index}>
   <th scope="row">{row.label}</th><td>{row.value}</td>
  </tr>)}</tbody></table>;
 }
 if(model.kind==="text")return <p>{model.text??""}</p>;
 if(model.kind==="line"||model.kind==="bar"){
  const data=model.points??[];
  const values=data.map(p=>p.value).filter((v):v is number=>v!==null);
  if(!values.length)return <span role="status">{labels.noHistory}</span>;
  const lo=Math.min(0,...values),hi=Math.max(0,...values);
  const range=hi-lo||1;
  const x=(i:number)=>36+i*440/Math.max(1,data.length-1);
  const y=(v:number)=>150-(v-lo)*120/range;
  const segments:string[][]=[];
  let current:string[]=[];
  for(let i=0;i<data.length;i++){
   const v=data[i].value;
   if(v===null){if(current.length)segments.push(current);current=[];}
   else current.push(`${x(i)},${y(v)}`);
  }
  if(current.length)segments.push(current);
  return <figure>
   <svg viewBox="0 0 520 180" style={chartStyle} role="img"
    aria-label={model.kind==="line"?"Courbe historique":"Histogramme historique"}>
    <line x1="36" y1="150" x2="485" y2="150" stroke="currentColor" strokeOpacity=".4"/>
    {model.kind==="line"?segments.map((points,i)=>
      <polyline key={i} points={points.join(" ")} stroke="currentColor" strokeWidth="2"
       fill="none"/>):data.map((p,i)=>p.value===null?null:
       <rect key={i} x={x(i)-Math.min(14,220/data.length)} y={Math.min(y(p.value),y(0))}
        width={Math.min(28,440/data.length)} height={Math.max(1,Math.abs(y(p.value)-y(0)))}
        fill="currentColor"/>)}
   </svg>
   <figcaption><table><thead><tr><th>Cycle</th><th>Valeur</th></tr></thead>
    <tbody>{data.map((p,i)=><tr key={i}><th scope="row">{p.label}</th>
      <td>{p.value===null?labels.nullValue:valueLabel(p.value,model.unit,locale)}</td></tr>)}</tbody>
   </table></figcaption>
  </figure>;
 }
 return <span role="status">{labels.incompatible}</span>;
}
