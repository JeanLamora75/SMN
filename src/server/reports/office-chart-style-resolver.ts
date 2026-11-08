/**
 * SMN-417 — Pure, immutable style selection for the Office chart pipeline.
 * No indicator projection, rasterization, HTTP or SQL is performed here.
 */
import type {Client} from "pg";
import {
 CHART_TYPES,PREDEFINED_CHART_STYLES,validChartStyleConfig,validChartStyleId,validChartType,
 type ChartStyleConfig,type ChartType
} from "./chart-style-contract";
import {readChartStyles,type ChartStyleActor} from "./chart-style-store";

export type OfficeChartRequest={type:ChartType;style?:string;last?:number;tags?:readonly string[]|null};
export type OfficeStyleRecord=Readonly<{
 id:string;revision:number;config:ChartStyleConfig;source:"builtin"|"custom"
}>;
export type OfficeStyleSnapshot=Readonly<{
 styles:ReadonlyArray<OfficeStyleRecord>;
 defaults:Readonly<Partial<Record<ChartType,{styleId:string;revision:number}>>>;
}>;
export type ResolvedOfficeChartStyle=Readonly<{
 type:ChartType;
 id:string|null;
 source:"tag"|"report"|"default"|"legacy";
 revision:number|null;
 config:Readonly<ChartStyleConfig>|null;
}>;

export class OfficeChartStyleResolutionError extends Error{
 constructor(public readonly code:
  "office-chart-invalid-style-id"|"office-chart-invalid-style"|
  "office-chart-style-not-found"|"office-chart-style-corrupt",
  public readonly styleId:string|null=null){
  super(code);this.name="OfficeChartStyleResolutionError";
 }
}
function freezeDeep<T>(value:T):T{
 if(value!==null&&typeof value==="object"){
  for(const child of Object.values(value))freezeDeep(child);
  Object.freeze(value);
 }
 return value;
}
/** Make a defensive read-only snapshot; avoid mutating records shared with the UI. */
export function createOfficeStyleSnapshot(raw:{
 styles:ReadonlyArray<{id:string;revision:number;source:"builtin"|"custom";config:unknown}>;
 defaults:Partial<Record<ChartType,{styleId:string;revision:number}>>;
}):OfficeStyleSnapshot{
 const seen=new Set<string>(),styles:OfficeStyleRecord[]=[];
 for(const record of raw.styles){
  if(!validChartStyleId(record.id)||record.id==="legacy"||seen.has(record.id)||
   !Number.isSafeInteger(record.revision)||record.revision<0||
   !["builtin","custom"].includes(record.source)||
   !validChartStyleConfig(record.config))
   throw new OfficeChartStyleResolutionError("office-chart-style-corrupt",record.id);
  seen.add(record.id);
  styles.push({id:record.id,revision:record.revision,source:record.source,
   config:structuredClone(record.config)});
 }
 const defaults:Partial<Record<ChartType,{styleId:string;revision:number}>>={};
 for(const type of CHART_TYPES){
  const d=raw.defaults[type];
  if(d!==undefined){
   if(!validChartStyleId(d.styleId)||!seen.has(d.styleId)||
    !Number.isSafeInteger(d.revision)||d.revision<0)
    throw new OfficeChartStyleResolutionError("office-chart-style-corrupt",d.styleId);
   defaults[type]={styleId:d.styleId,revision:d.revision};
  }
 }
 return freezeDeep({styles,defaults});
}
/**
 * One catalog load per export, within a repeatable-read transaction.
 * A concurrent change cannot pair two revisions of style/default metadata.
 * Call before rendering, not once per chart.
 */
export async function loadOfficeStyleSnapshot(db:Client,actor:ChartStyleActor):Promise<OfficeStyleSnapshot>{
 await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
 try{
  const catalog=await readChartStyles(db,actor);
  const result=createOfficeStyleSnapshot(catalog);
  await db.query("COMMIT");
  return result;
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
/**
 * Create once per report. No further I/O in the returned function.
 * Priority: tag > report override > per-type default > legacy.
 * Explicitly named styles must exist; never silently substitute another.
 */
export function createOfficeChartStyleResolver(
 snapshot:OfficeStyleSnapshot|null,
 reportStyleId:string|null|undefined=null
):(request:OfficeChartRequest)=>ResolvedOfficeChartStyle{
 if(reportStyleId!==undefined&&reportStyleId!==null&&!validChartStyleId(reportStyleId))
  throw new OfficeChartStyleResolutionError("office-chart-invalid-style-id",String(reportStyleId));
 const available=new Map<string,OfficeStyleRecord>(snapshot?.styles.map(s=>[s.id,s] as const)??[]);
 if(reportStyleId!==undefined&&reportStyleId!==null&&reportStyleId!=="legacy"&&!available.has(reportStyleId))
  throw new OfficeChartStyleResolutionError("office-chart-style-not-found",reportStyleId);
 return (request:OfficeChartRequest)=>{
  if(!validChartType(request.type))
   throw new OfficeChartStyleResolutionError("office-chart-invalid-style",String(request.type));
  if(request.style!==undefined&&!validChartStyleId(request.style))
   throw new OfficeChartStyleResolutionError("office-chart-invalid-style-id",String(request.style));
  const byTag=request.style!==undefined;
  const byReport=!byTag&&reportStyleId!==undefined&&reportStyleId!==null;
  const id=byTag?request.style:byReport?reportStyleId:snapshot?.defaults[request.type]?.styleId;
  if(id===undefined||id===null)
   return freezeDeep({type:request.type,id:null,source:"legacy" as const,revision:null,config:null});
  // Reserved compatibility profile reproduces the historical Word/PPTX renderer.
  if(id==="legacy")return freezeDeep({type:request.type,id:"legacy",source:"legacy" as const,revision:null,config:null});
  const selected=available.get(id);
  if(!selected)
   throw new OfficeChartStyleResolutionError("office-chart-style-not-found",id);
  return freezeDeep({
   type:request.type,id,
   source:byTag?"tag" as const:byReport?"report" as const:"default" as const,
   revision:selected.revision,
   config:selected.config
  });
 };
}

/** Optional compatibility helper for deployments where the registry is not yet populated. */
export function legacyOfficeStyleSnapshot():OfficeStyleSnapshot{
 return createOfficeStyleSnapshot({styles:PREDEFINED_CHART_STYLES.map(s=>({
  id:s.id,revision:0,source:"builtin" as const,config:s.config
 })),defaults:{}});
}
