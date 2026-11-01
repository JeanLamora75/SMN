import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {buildDependencyGraph,evaluateDependencies,impactedIndicatorIds,isCalendarSourceTag,type IndicatorDefinition,type DependencyRow} from "./dependencies";
import {parseFormula,referencedTags,type SourceValue} from "./formula";
import {recalculateIndicatorResultsWithinTransaction} from "./recalculation";

export type FormulaProposal=Readonly<{indicatorId:string;formula:string}>;
export type FormulaPreview=Readonly<{globalRevision:string;fingerprint:string;indicatorId:string;formula:string;affectedIndicators:readonly string[];cycles:number;results:number;unavailable:number}>;
export type FormulaPublishResult={ok:true;revision:string;cycles:number;results:number}|{ok:false;error:"stale_preview"|"invalid_formula"|"not_found"|"budget"};
export class FormulaPublicationError extends Error{
 constructor(public readonly code:"invalid_formula"|"not_found"|"budget",message:string){super(message);this.name="FormulaPublicationError";}
}
const MAX_CYCLES=1000,MAX_RESULTS=100000;
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const validId=(x:unknown):x is string=>typeof x==="string"&&x.length>0&&x.length<=160;
function check(input:FormulaProposal){
 if(!input||!validId(input.indicatorId)||typeof input.formula!=="string"||input.formula.length<1||input.formula.length>4096)
  throw new FormulaPublicationError("invalid_formula","Invalid formula input");
}
type Row=IndicatorDefinition&{indicator_type:string;formula_revision:string};
type Cycle={team_id:string;cycle_type:"scrum"|"kanban";cycle_id:string};
async function prepare(db:Client,input:FormulaProposal){
 check(input);
 const rev=await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton'");
 if(!rev.rows[0])throw new FormulaPublicationError("not_found","v33 required");
 const defs=await db.query<Row>("SELECT id,tag,formula,indicator_type,formula_revision::text FROM public.smn_indicator_definition ORDER BY tag");
 const current=defs.rows.find(x=>x.id===input.indicatorId);
 if(!current||current.indicator_type!=="computed"||current.formula===null||input.formula===current.formula)
  throw new FormulaPublicationError("invalid_formula","Missing computed indicator or unchanged formula");
 const existing=await db.query<DependencyRow&{id:string}>("SELECT id,indicator_id,source_type,source_indicator_id,source_calendar_tag FROM public.smn_indicator_dependency ORDER BY indicator_id,id");
 let tags:string[];
 try{tags=[...new Set(referencedTags(parseFormula(input.formula)))].sort();}
 catch(e){throw new FormulaPublicationError("invalid_formula",e instanceof Error?e.message:"Invalid expression");}
 const tagMap=new Map(defs.rows.map(x=>[x.tag,x.id]));
 const replacement:DependencyRow[]=tags.map(tag=>{
  const sourceId=tagMap.get(tag);
  if(sourceId)return {indicator_id:input.indicatorId,source_type:"indicator",source_indicator_id:sourceId,source_calendar_tag:null};
  if(isCalendarSourceTag(tag))return {indicator_id:input.indicatorId,source_type:"calendar",source_indicator_id:null,source_calendar_tag:tag};
  throw new FormulaPublicationError("invalid_formula","Unknown tag: "+tag);
 });
 const edges=[...existing.filter(x=>x.indicator_id!==input.indicatorId),...replacement];
 const proposed=defs.rows.map(x=>x.id===input.indicatorId?{...x,formula:input.formula}:x);
 let graph:ReturnType<typeof buildDependencyGraph>;
 try{graph=buildDependencyGraph(proposed,edges);}
 catch(e){throw new FormulaPublicationError("invalid_formula",e instanceof Error?e.message:"Invalid dependency graph");}
 const affected=impactedIndicatorIds(graph,[input.indicatorId]).filter(id=>graph.definitions.get(id)?.formula!==null);
 const cycles=await db.query<Cycle>(
  "SELECT s.team_id,'scrum'::text AS cycle_type,s.id AS cycle_id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id WHERE s.deleted_at IS NULL AND NOT t.is_archived AND t.agile_mode='scrum' "+
  "UNION ALL SELECT p.team_id,'kanban',p.id FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id WHERE p.deleted_at IS NULL AND NOT t.is_archived AND t.agile_mode='kanban' ORDER BY team_id,cycle_type,cycle_id LIMIT 1001");
 if(cycles.rows.length>MAX_CYCLES||cycles.rows.length*affected.length>MAX_RESULTS)throw new FormulaPublicationError("budget","Too many recalculations");
 const content={definitions:defs.rows,dependencies:existing.rows,cycles:cycles.rows};
 const fingerprint=digest({revision:rev.rows[0].revision,content,proposal:input});
 let unavailable=0;
 for(const cycle of cycles.rows){
  const params=[cycle.team_id,cycle.cycle_type,cycle.cycle_id];
  const manual=await db.query<{indicator_id:string;value:string|null}>("SELECT indicator_id,value::text AS value FROM public.smn_indicator_manual_value WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=$3 ORDER BY indicator_id",params);
  const computed=await db.query<{indicator_id:string;result_state:string;value:string|null;unavailable_reason:string|null;unavailable_source_tag:string|null}>("SELECT indicator_id,result_state,value::text AS value,unavailable_reason,unavailable_source_tag FROM public.smn_indicator_computed_result WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=$3 ORDER BY indicator_id",params);
  const values:Record<string,SourceValue>=Object.create(null) as Record<string,SourceValue>;
  for(const v of manual.rows)values[v.indicator_id]=v.value;
  for(const v of computed.rows)values[v.indicator_id]=v.result_state==="available"?v.value:{kind:"unavailable",reason:(v.unavailable_reason??"missing_source") as "missing_source",sourceTag:v.unavailable_source_tag??undefined};
  const calculated=evaluateDependencies({graph,indicators:values,calendar:{},changedIndicatorIds:[input.indicatorId]});
  unavailable+=[...calculated.values()].filter(x=>x.kind==="unavailable").length;
 }
 return {globalRevision:rev.rows[0].revision,fingerprint,indicatorId:input.indicatorId,formula:input.formula,affectedIndicators:affected,cycles:cycles.rows.length,results:cycles.rows.length*affected.length,unavailable,edges:replacement,teams:[...new Set(cycles.rows.map(x=>x.team_id))].sort()};
}
/** No writes, not even sequence changes or audit records. */
export async function previewFormula(db:Client,input:FormulaProposal):Promise<FormulaPreview>{
 await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
 try{
  const p=await prepare(db,input);
  await db.query("COMMIT");
  return {globalRevision:p.globalRevision,fingerprint:p.fingerprint,indicatorId:p.indicatorId,formula:p.formula,affectedIndicators:p.affectedIndicators,cycles:p.cycles,results:p.results,unavailable:p.unavailable};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
/** Confirmation must supply the exact preview revision and content fingerprint. */
export async function publishFormula(db:Client,input:FormulaProposal,confirmation:Pick<FormulaPreview,"globalRevision"|"fingerprint">):Promise<FormulaPublishResult>{
 check(input);
 if(!confirmation||typeof confirmation.globalRevision!=="string"||!/^[a-f0-9]{64}$/.test(confirmation.fingerprint))
  return {ok:false,error:"stale_preview"};
 await db.query("BEGIN");
 try{
  const locked=await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton' FOR UPDATE");
  if(locked.rows[0]?.revision!==confirmation.globalRevision){await db.query("ROLLBACK");return {ok:false,error:"stale_preview"};}
  const p=await prepare(db,input);
  if(p.fingerprint!==confirmation.fingerprint){await db.query("ROLLBACK");return {ok:false,error:"stale_preview"};}
  await db.query("UPDATE public.smn_indicator_definition SET formula=$2,formula_revision=formula_revision+1,updated_at=now() WHERE id=$1",[input.indicatorId,input.formula]);
  await db.query("DELETE FROM public.smn_indicator_dependency WHERE indicator_id=$1",[input.indicatorId]);
  for(const edge of p.edges)await db.query("INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id,source_calendar_tag) VALUES($1,$2,$3,$4,$5)",[randomUUID(),edge.indicator_id,edge.source_type,edge.source_indicator_id,edge.source_calendar_tag]);
  let results=0,cycles=0;
  for(const teamId of p.teams){
   const recalculated=await recalculateIndicatorResultsWithinTransaction(db,{teamId,changedIndicatorIds:[input.indicatorId]});
   results+=recalculated.results;cycles+=recalculated.cycles;
  }
  await db.query("UPDATE public.smn_indicator_system_revision SET revision=revision+1,updated_at=now() WHERE singleton_key='singleton'");
  const next=(BigInt(p.globalRevision)+1n).toString();
  await db.query("COMMIT");
  console.info("indicator-formula-published",{indicatorId:input.indicatorId,cycles,results,revision:next});
  return {ok:true,revision:next,cycles,results};
 }catch(e){
  await db.query("ROLLBACK").catch(()=>undefined);
  if(e instanceof FormulaPublicationError)return {ok:false,error:e.code};
  throw e;
 }
}
