/** Global Office chart styles; no reporting data or SQL imports in this contract. */
export const CHART_TYPES=["bar","line","area","pie","donut","gauge"] as const;
export type ChartType=typeof CHART_TYPES[number];
export const BUILTIN_IDS=["cockpit-agile","corporate","minimal"] as const;
export type ChartStyleConfig={
 schemaVersion:1;
 common:{
  palette:string[];background:string;textColor:string;
  fontFamily:"Arial"|"Segoe UI"|"Calibri";
  fontSize:number;title:string;subtitle:string;
  legend:{visible:boolean;position:"bottom"|"right"|"none"};
  labels:{visible:boolean;decimals:number};
  spacing:number;
 };
 types:{
  bar:{orientation:"vertical"|"horizontal";mode:"grouped"|"stacked";gap:number;radius:number};
  line:{strokeWidth:number;marker:"circle"|"square"|"none";smooth:boolean};
  area:{opacity:number;stacked:boolean};
  pie:{showPercent:boolean;separation:number};
  donut:{innerRadiusPercent:number;showCenterValue:boolean};
  gauge:{strokePercent:number;min:number;max:number;thresholds:number[]};
 };
};
const DEFAULT_TYPES:ChartStyleConfig["types"]={
 bar:{orientation:"vertical",mode:"grouped",gap:16,radius:0},
 line:{strokeWidth:3,marker:"circle",smooth:false},
 area:{opacity:0.18,stacked:false},
 pie:{showPercent:false,separation:0},
 donut:{innerRadiusPercent:58,showCenterValue:false},
 gauge:{strokePercent:25,min:0,max:100,thresholds:[50,80]}
};
function base(palette:string[]):ChartStyleConfig{
 return {schemaVersion:1,common:{palette,background:"#ffffff",textColor:"#33465c",
  fontFamily:"Arial",fontSize:12,title:"",subtitle:"",legend:{visible:true,position:"bottom"},
  labels:{visible:false,decimals:2},spacing:12},
  types:structuredClone(DEFAULT_TYPES)};
}
export const PREDEFINED_CHART_STYLES=Object.freeze([
 {id:"cockpit-agile",name:"Cockpit Agile",description:"Lisibilité opérationnelle",config:base(["#1b508d","#b45638","#159895","#7955a7","#bc8c21","#426da4"])},
 {id:"corporate",name:"Corporate",description:"Présentation managériale",config:base(["#17345f","#3979bd","#86aecf","#cbdbe9","#7299be","#31496c"])},
 {id:"minimal",name:"Minimal",description:"Rapports sobres et imprimables",config:base(["#292929","#555555","#888888","#bbbbbb","#444444","#999999"])}
] as const);
// Presets are immutable at every level; editing starts from a structured clone.
function freezeDeep<T>(value:T):T{
 if(value!==null&&typeof value==="object"){
  for(const child of Object.values(value))freezeDeep(child);
  Object.freeze(value);
 }
 return value;
}
for(const preset of PREDEFINED_CHART_STYLES)freezeDeep(preset);
export const DEFAULT_STYLE_ID="cockpit-agile";
export class ChartStyleError extends Error{
 constructor(public readonly code:"invalid-input"|"forbidden"|"not-found"|"conflict"|"protected-style"|"default-style"|"schema-not-ready"){
  super(code);this.name="ChartStyleError";
 }
}
const plain=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==="object"&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
function fields(v:unknown,names:string[]):v is Record<string,unknown>{
 return plain(v)&&Object.keys(v).every(k=>names.includes(k))&&names.every(k=>Object.hasOwn(v,k));
}
const integer=(n:unknown,min:number,max:number):n is number=>Number.isInteger(n)&&(n as number)>=min&&(n as number)<=max;
const color=(n:unknown)=>typeof n==="string"&&/^#[0-9a-fA-F]{6}$/.test(n);
const boolean=(n:unknown)=>typeof n==="boolean";
const str=(n:unknown,max:number)=>typeof n==="string"&&n.length<=max&& !/[<>\u0000-\u001f]/.test(n);
const oneOf=(v:unknown,values:readonly string[])=>typeof v==="string"&&values.includes(v);
export const validChartType=(v:unknown):v is ChartType=>oneOf(v,CHART_TYPES);
export function validChartStyleConfig(raw:unknown):raw is ChartStyleConfig{
 if(!fields(raw,["schemaVersion","common","types"])||raw.schemaVersion!==1)return false;
 const c=raw.common,t=raw.types;
 if(!fields(c,["palette","background","textColor","fontFamily","fontSize","title","subtitle","legend","labels","spacing"]))return false;
 const palette=c.palette;
 if(!Array.isArray(palette)||palette.length<1||palette.length>6||!palette.every(color)||
  !color(c.background)||!color(c.textColor)||!oneOf(c.fontFamily,["Arial","Segoe UI","Calibri"])||
  !integer(c.fontSize,9,48)||!str(c.title,120)||!str(c.subtitle,160)||!integer(c.spacing,0,80))return false;
 if(!fields(c.legend,["visible","position"])||!boolean(c.legend.visible)||
  !oneOf(c.legend.position,["bottom","right","none"]))return false;
 if(!fields(c.labels,["visible","decimals"])||!boolean(c.labels.visible)||!integer(c.labels.decimals,0,2))return false;
 if(!fields(t,[...CHART_TYPES]))return false;
 const x=t as Record<string,unknown>;
 const b=x.bar,l=x.line,a=x.area,p=x.pie,d=x.donut,g=x.gauge;
 if(!fields(b,["orientation","mode","gap","radius"])||!oneOf(b.orientation,["vertical","horizontal"])||
  !oneOf(b.mode,["grouped","stacked"])||!integer(b.gap,0,90)||!integer(b.radius,0,40))return false;
 if(!fields(l,["strokeWidth","marker","smooth"])||!integer(l.strokeWidth,1,12)||
  !oneOf(l.marker,["circle","square","none"])||!boolean(l.smooth))return false;
 if(!fields(a,["opacity","stacked"])||typeof a.opacity!=="number"||!Number.isFinite(a.opacity)||
  a.opacity<0||a.opacity>1||!boolean(a.stacked))return false;
 if(!fields(p,["showPercent","separation"])||!boolean(p.showPercent)||!integer(p.separation,0,15))return false;
 if(!fields(d,["innerRadiusPercent","showCenterValue"])||!integer(d.innerRadiusPercent,20,80)||!boolean(d.showCenterValue))return false;
 if(!fields(g,["strokePercent","min","max","thresholds"])||!integer(g.strokePercent,5,50)||
  !integer(g.min,0,99)||!integer(g.max,1,100)||g.max<=g.min||
  !Array.isArray(g.thresholds)||g.thresholds.length>5||
  !g.thresholds.every((n:unknown)=>integer(n,g.min as number,g.max as number))||
  (g.thresholds as number[]).some((n,i)=>i>0&&n<=(g.thresholds as number[])[i-1]))return false;
 return true;
}
export const validChartStyleId=(id:unknown):id is string=>typeof id==="string"&&/^[a-z][a-z0-9-]{2,63}$/.test(id);
export function parseChartStyleCommand(raw:unknown):
 |{action:"create";id:string;name:string;description:string;config:ChartStyleConfig}
 |{action:"update";id:string;name:string;description:string;revision:number;config:ChartStyleConfig}
 |{action:"delete";id:string;revision:number}
 |{action:"set-default";type:ChartType;styleId:string;revision:number}{
 if(!plain(raw)||typeof raw.action!=="string")throw new ChartStyleError("invalid-input");
 const a=raw.action;
 if(a==="create"||a==="update"){
  const keys=a==="create"?["action","id","name","description","config"]:["action","id","name","description","config","revision"];
  if(!fields(raw,keys)||!validChartStyleId(raw.id)||BUILTIN_IDS.some(id=>id===raw.id)||
   raw.id==="legacy"||!str(raw.name,120)||!(raw.name as string).trim()||!str(raw.description,500)||
   !validChartStyleConfig(raw.config))throw new ChartStyleError("invalid-input");
  if(a==="create")return {action:a,id:raw.id,name:(raw.name as string).trim(),description:raw.description as string,config:raw.config};
  if(!integer(raw.revision,1,2147483647))throw new ChartStyleError("invalid-input");
  return {action:a,id:raw.id,name:(raw.name as string).trim(),description:raw.description as string,config:raw.config,revision:raw.revision as number};
 }
 if(a==="delete"&&fields(raw,["action","id","revision"])&&validChartStyleId(raw.id)&&integer(raw.revision,1,2147483647))
  return {action:a,id:raw.id,revision:raw.revision as number};
 if(a==="set-default"&&fields(raw,["action","type","styleId","revision"])&&validChartType(raw.type)&&
  validChartStyleId(raw.styleId)&&integer(raw.revision,0,2147483647))
  return {action:a,type:raw.type,styleId:raw.styleId,revision:raw.revision as number};
 throw new ChartStyleError("invalid-input");
}
