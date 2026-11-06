import type {SourceDescriptor,SourceView} from "./sources";
import {resolveTachometerRatio} from "../../lib/dashboard-builder/tachometer";

export type DashboardValue =
 | {state:"available";value:number;unit:string|null}
 | {state:"null"}
 | {state:"absent"}
 | {state:"error";message?:string};
export type DashboardPoint = Readonly<{label:string;value:number|null}>;
export type DashboardVisualizationData = Readonly<{
 result:DashboardValue;
 points?:readonly DashboardPoint[];
 rows?:readonly Readonly<{label:string;value:string}>[];
 text?:string;
 minimum?:number;
 maximum?:number;
 snapshot?:boolean;
}>;
export type VisualizationKind="number"|"card"|"card-watermark"|"tachometer"|"gauge"|"line"|"bar"|"bar-horizontal"|"battery-horizontal"|"battery-vertical"|"trend-arrow"|"list"|"list-watermark"|"text";
export type VisualizationModel=Readonly<{
 state:"ready"|"null"|"absent"|"error"|"no-history"|"invalid-bounds"|"incompatible";
 kind:VisualizationKind;
 value?:number;
 unit?:string|null;
 label?:string;
 ratio?:number;
 points?:readonly DashboardPoint[];
 rows?:readonly Readonly<{label:string;value:string}>[];
 text?:string;
 snapshot?:boolean;
}>;
const choices:Readonly<Record<VisualizationKind,string>>={
 number:"123",card:"▣","card-watermark":"◉",tachometer:"◠",gauge:"◔",line:"⌁",bar:"▥","bar-horizontal":"☰","battery-horizontal":"▰","battery-vertical":"▥","trend-arrow":"↗",list:"☷","list-watermark":"▤",text:"¶",
};
export function compatibleVisualizations(source:SourceDescriptor):readonly Readonly<{kind:SourceView;thumbnail:string}>[]{
 if(source.status!=="available")return [];
 return source.views.filter((v):v is SourceView=>v in choices).map(kind=>({kind,thumbnail:choices[kind as VisualizationKind]}));
}
/** A view never derives a KPI: values and historical snapshots come only from its owner. */
export function resolveVisualization(source:SourceDescriptor,kind:VisualizationKind,data:DashboardVisualizationData):VisualizationModel {
 if(source.status!=="available"||!source.views.includes(kind))return {state:"incompatible",kind};
 const base={kind,snapshot:data.snapshot??false};
 if(data.result.state!=="available")return {...base,state:data.result.state};
 const value=data.result.value;
 if(!Number.isFinite(value))return {...base,state:"error"};
 if(kind==="tachometer"||kind==="battery-horizontal"||kind==="battery-vertical"){
  const ratio=resolveTachometerRatio(value,data.minimum,data.maximum);
  return ratio===null?{...base,state:"invalid-bounds"}:{...base,state:"ready",value,unit:data.result.unit,ratio};
 }
 if(kind==="gauge"){
  if(!Number.isFinite(data.minimum)||!Number.isFinite(data.maximum)||
     data.minimum!>=data.maximum!||value<data.minimum!||value>data.maximum!)
   return {...base,state:"invalid-bounds"};
  return {...base,state:"ready",value,unit:data.result.unit,ratio:(value-data.minimum!)/(data.maximum!-data.minimum!)};
 }
 if(kind==="line"||kind==="bar"||kind==="bar-horizontal"){
  const points=data.points??[];
  if(!points.length||!points.some(p=>p.value!==null))return {...base,state:"no-history"};
  if(points.some(p=>p.value!==null&&!Number.isFinite(p.value)))return {...base,state:"error"};
  return {...base,state:"ready",points:points.map(p=>({...p})),unit:data.result.unit};
 }
 if(kind==="list"||kind==="list-watermark")return {...base,state:"ready",rows:data.rows??[]};
 if(kind==="text")return {...base,state:"ready",text:data.text??""};
 return {...base,state:"ready",value,unit:data.result.unit};
}
