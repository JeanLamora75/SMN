import type {Client} from "pg";
import {loadHistoricalResolver} from "./formula/historical-context";
import {loadRoleCapacityResolver,type RoleCapacityRequest} from "./formula/role-context";
import type {AgileRole,RoleCapacityFunction} from "./formula";
import {loadDependencyGraph,impactedIndicatorIds,evaluateDependencies,type CalendarSourceTag} from "./dependencies";
import type {SourceValue} from "./formula";
import type {CycleType} from "./manual-values";

export type CycleScope=Readonly<{teamId:string;cycleType:CycleType;cycleId:string}>;
export type RecalculationRequest=Readonly<{
 teamId:string;
 cycles?:readonly CycleScope[];
 changedIndicatorIds?:readonly string[];
 changedCalendarTags?:readonly CalendarSourceTag[];
 calendarSources?:Readonly<Record<string,Readonly<Partial<Record<CalendarSourceTag,SourceValue>>>>>;
}>;
export class IndicatorRecalculationError extends Error{
 constructor(public readonly code:"invalid-scope"|"schema-not-ready"|"cycle-not-found"|"budget",message:string){
  super(message);this.name="IndicatorRecalculationError";
 }
}
const safeId=(v:unknown):v is string=>typeof v==="string"&&v.length>0&&v.length<=160;
const cycleKey=(c:CycleScope)=>c.cycleType+":"+c.cycleId;
const MAX_CYCLES=1000,MAX_RESULTS=100000;
export function validateRecalculationRequest(input:RecalculationRequest):void{
 if(!input||!safeId(input.teamId)||input.cycles&&input.cycles.length>MAX_CYCLES)
  throw new IndicatorRecalculationError("invalid-scope","Invalid team or cycle count");
 for(const cycle of input.cycles??[]){
  if(cycle.teamId!==input.teamId||!safeId(cycle.cycleId)||!["scrum","kanban"].includes(cycle.cycleType))
   throw new IndicatorRecalculationError("invalid-scope","Invalid cycle");
 }
}
export async function recalculateIndicatorResultsWithinTransaction(db:Client,input:RecalculationRequest):Promise<{cycles:number;results:number}>{
 validateRecalculationRequest(input);
  const version=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  if(version.rows[0]?.schema_version!==33)throw new IndicatorRecalculationError("schema-not-ready","v33 required");
  // All indicator writers lock the global revision first.
  const lock=await db.query("SELECT revision FROM public.smn_indicator_system_revision WHERE singleton_key='singleton' FOR UPDATE");
  if(!lock.rows.length)throw new IndicatorRecalculationError("schema-not-ready","revision missing");
  const graph=await loadDependencyGraph(db);
  const calendar=input.changedCalendarTags??[];
  const roleAffected=calendar.length?[...graph.definitions.values()]
   .filter(d=>d.formula!==null&&/\\b(?:ROLE_JH|ROLE_JH_PLANNED|ROLE_MAX_JH)\\s*\\(/.test(d.formula))
   .map(d=>d.id):[];
  const changed=[...(input.changedIndicatorIds??[]),...roleAffected];
  const selected=input.changedIndicatorIds!==undefined||input.changedCalendarTags!==undefined?
   impactedIndicatorIds(graph,changed,calendar):graph.order;
  const calculated=selected.filter(id=>graph.definitions.get(id)?.formula!==null);
  if(calculated.length===0)return {cycles:0,results:0};
  const hasHistorical=[...graph.definitions.values()].some(d=>d.formula!==null&&/\b(?:SUM_LAST|LAST_VALUES|AVG_LAST|MIN_LAST|MAX_LAST|PREVIOUS|DELTA|DELTA_PCT)\s*\(/.test(d.formula));
  const scopes:CycleScope[]=input.cycles&&!hasHistorical?[...input.cycles]:[
   ...(await db.query<{id:string}>("SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id WHERE s.team_id=$1 AND s.deleted_at IS NULL AND t.agile_mode='scrum' AND NOT t.is_archived ORDER BY s.start_at,s.id",[input.teamId])).rows.map(r=>({teamId:input.teamId,cycleType:"scrum" as const,cycleId:r.id})),
   ...(await db.query<{id:string}>("SELECT p.id FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id WHERE p.team_id=$1 AND p.deleted_at IS NULL AND t.agile_mode='kanban' AND NOT t.is_archived ORDER BY p.start_on,p.id",[input.teamId])).rows.map(r=>({teamId:input.teamId,cycleType:"kanban" as const,cycleId:r.id}))
  ];
  if(scopes.length>MAX_CYCLES||scopes.length*calculated.length>MAX_RESULTS)
   throw new IndicatorRecalculationError("budget","Recalculation budget exceeded");
  const requestedRoles:RoleCapacityRequest[]=[];
  const rolePattern=/\\b(ROLE_MAX_JH|ROLE_JH_PLANNED|ROLE_JH)\\s*\\(\\s*"(DEVELOPER|SCRUM_MASTER|PRODUCT_OWNER)"\\s*\\)/g;
  for(const definition of graph.definitions.values())for(const match of definition.formula?.matchAll(rolePattern)??[]){
   if(!requestedRoles.some(x=>x.name===match[1]&&x.role===match[2]))
    requestedRoles.push({name:match[1] as RoleCapacityFunction,role:match[2] as AgileRole});
  }
  let written=0;
  for(const scope of scopes){
   const table=scope.cycleType==="scrum"?"smn_sprint":"smn_kanban_period";
   const exists=await db.query("SELECT c.id FROM public."+table+" c JOIN public.smn_team t ON t.id=c.team_id WHERE c.id=$1 AND c.team_id=$2 AND c.deleted_at IS NULL AND t.agile_mode=$3 AND NOT t.is_archived FOR UPDATE OF c",[scope.cycleId,input.teamId,scope.cycleType]);
   if(exists.rows.length!==1)throw new IndicatorRecalculationError("cycle-not-found",cycleKey(scope));
   const manual=await db.query<{indicator_id:string;value:string|null}>(
    "SELECT indicator_id,value::text FROM public.smn_indicator_manual_value WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=$3",
    [input.teamId,scope.cycleType,scope.cycleId]);
   const existing=await db.query<{indicator_id:string;result_state:string;value:string|null;unavailable_reason:string|null;unavailable_source_tag:string|null}>(
    "SELECT indicator_id,result_state,value::text,unavailable_reason,unavailable_source_tag FROM public.smn_indicator_computed_result WHERE team_id=$1 AND cycle_type=$2 AND cycle_id=$3",
    [input.teamId,scope.cycleType,scope.cycleId]);
   const sources:Record<string,SourceValue>=Object.create(null) as Record<string,SourceValue>;
   for(const row of manual.rows)sources[row.indicator_id]=row.value;
   for(const row of existing.rows){
    if(row.result_state==="available")sources[row.indicator_id]=row.value;
    else if(row.unavailable_reason==="missing_source"||row.unavailable_reason==="division_by_zero"||row.unavailable_reason==="dependency_unavailable"||row.unavailable_reason==="invalid_domain")
     sources[row.indicator_id]={kind:"unavailable",reason:row.unavailable_reason,sourceTag:row.unavailable_source_tag??undefined};
   }
   const historical=await loadHistoricalResolver(db,scope,graph.byTag);
   const roleCapacity=await loadRoleCapacityResolver(db,scope,requestedRoles);
   const values=evaluateDependencies({graph,indicators:sources,calendar:input.calendarSources?.[cycleKey(scope)]??{},changedIndicatorIds:changed.length?changed:input.changedIndicatorIds,changedCalendarTags:input.changedCalendarTags,historical:()=>historical,roleCapacity});
   for(const [indicatorId,result] of values){
    const revision=await db.query<{formula_revision:string}>("SELECT formula_revision::text FROM public.smn_indicator_definition WHERE id=$1 FOR SHARE",[indicatorId]);
    const formulaRevision=revision.rows[0]?.formula_revision;
    if(formulaRevision===undefined)throw new IndicatorRecalculationError("schema-not-ready","Indicator removed");
    const available=result.kind==="available";
    await db.query(
     "INSERT INTO public.smn_indicator_computed_result(team_id,cycle_type,cycle_id,indicator_id,result_state,value,unavailable_reason,unavailable_detail,unavailable_source_tag,formula_revision) "+
     "VALUES($1,$2,$3,$4,$5,$6::numeric,$7,$8,$9,$10::bigint) ON CONFLICT(team_id,cycle_type,cycle_id,indicator_id) DO UPDATE SET "+
     "result_state=EXCLUDED.result_state,value=EXCLUDED.value,unavailable_reason=EXCLUDED.unavailable_reason,"+
     "unavailable_detail=EXCLUDED.unavailable_detail,unavailable_source_tag=EXCLUDED.unavailable_source_tag,"+
     "formula_revision=EXCLUDED.formula_revision,calculated_at=now()",
     [input.teamId,scope.cycleType,scope.cycleId,indicatorId,available?"available":"unavailable",
      available?result.value:null,available?null:result.reason,available?null:result.detail??null,
      available?null:result.reason==="dependency_unavailable"?result.sourceTag??null:null,formulaRevision]);
    written++;
   }
  }
  return {cycles:scopes.length,results:written};
}
export async function recalculateIndicatorResults(db:Client,input:RecalculationRequest):Promise<{cycles:number;results:number}>{
 validateRecalculationRequest(input);
 await db.query("BEGIN");
 try{
  const result=await recalculateIndicatorResultsWithinTransaction(db,input);
  await db.query("COMMIT");
  return result;
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
