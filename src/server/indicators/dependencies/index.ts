import {evaluateFormula,referencedTags,parseFormula,FormulaBudgetError,type Expression,type Result,type SourceValue,type HistoricalResolver} from "../formula";

export type DependencyRow=Readonly<{indicator_id:string;source_type:"indicator"|"calendar";source_indicator_id:string|null;source_calendar_tag:string|null}>;
export type IndicatorDefinition=Readonly<{id:string;tag:string;formula:string|null;isActive?:boolean}>;
export type DependencyGraph=Readonly<{
 definitions:ReadonlyMap<string,IndicatorDefinition>;
 byTag:ReadonlyMap<string,string>;
 dependencies:ReadonlyMap<string,ReadonlySet<string>>;
 dependents:ReadonlyMap<string,ReadonlySet<string>>;
 calendarDependencies:ReadonlyMap<string,ReadonlySet<string>>;
 order:readonly string[];
}>;
export class DependencyGraphError extends Error {
 constructor(public readonly code:"duplicate_id"|"duplicate_tag"|"unknown_indicator"|"unknown_source"|"invalid_dependency"|"cycle"|"budget"|"formula_mismatch",message:string){
  super(message);this.name="DependencyGraphError";
 }
}
const MAX_NODES=10000,MAX_EDGES=100000,MAX_CASCADE_OPERATIONS=100000;
const compare=(a:string,b:string)=>a.localeCompare(b,"en");
const validTag=(tag:string)=>/^[A-Z][A-Z0-9_]*$/.test(tag);

/** Registry is intentionally explicit: technical sources never become catalog definitions. */
export const CALENDAR_SOURCE_TAGS=Object.freeze([
 "CAL_WORKING_DAYS","CAL_WORKING_HOURS","CAL_PUBLIC_HOLIDAYS",
 "CAL_ABSENCE_DAYS","CAL_CLOSURE_DAYS","CAL_CAPACITY_JH"
] as const);
export type CalendarSourceTag=typeof CALENDAR_SOURCE_TAGS[number];
const calendarTags:ReadonlySet<string>=new Set(CALENDAR_SOURCE_TAGS);
export function isCalendarSourceTag(tag:string):tag is CalendarSourceTag{return calendarTags.has(tag);}

export function buildDependencyGraph(definitions:readonly IndicatorDefinition[],rows:readonly DependencyRow[]):DependencyGraph{
 if(definitions.length>MAX_NODES||rows.length>MAX_EDGES)throw new DependencyGraphError("budget","graph size");
 const byId=new Map<string,IndicatorDefinition>(),byTag=new Map<string,string>();
 for(const definition of definitions){
  if(byId.has(definition.id))throw new DependencyGraphError("duplicate_id",definition.id);
  if(!validTag(definition.tag)||calendarTags.has(definition.tag)||byTag.has(definition.tag))
   throw new DependencyGraphError("duplicate_tag",definition.tag);
  byId.set(definition.id,definition);byTag.set(definition.tag,definition.id);
 }
 const deps=new Map<string,Set<string>>(),reverse=new Map<string,Set<string>>(),calendar=new Map<string,Set<string>>();
 for(const id of byId.keys()){deps.set(id,new Set());reverse.set(id,new Set());calendar.set(id,new Set());}
 for(const row of rows){
  if(!byId.has(row.indicator_id))throw new DependencyGraphError("unknown_indicator",row.indicator_id);
  if(row.source_type==="indicator"){
   if(!row.source_indicator_id||row.source_calendar_tag!==null||!byId.has(row.source_indicator_id))
    throw new DependencyGraphError("unknown_source",String(row.source_indicator_id));
   if(row.source_indicator_id===row.indicator_id)throw new DependencyGraphError("cycle","self dependency");
   deps.get(row.indicator_id)!.add(row.source_indicator_id);
   reverse.get(row.source_indicator_id)!.add(row.indicator_id);
  }else if(row.source_type==="calendar"){
   if(row.source_indicator_id!==null||!row.source_calendar_tag||!isCalendarSourceTag(row.source_calendar_tag))
    throw new DependencyGraphError("unknown_source",String(row.source_calendar_tag));
   calendar.get(row.indicator_id)!.add(row.source_calendar_tag);
  }else throw new DependencyGraphError("invalid_dependency","source type");
 }
 // The SQL graph must match the AST; missing edges would silently skip recalculation.
 for(const d of byId.values()){
  if(d.formula===null){if(deps.get(d.id)!.size||calendar.get(d.id)!.size)throw new DependencyGraphError("formula_mismatch",d.id);continue;}
  const expected=new Set(referencedTags(parseFormula(d.formula)));
  const actual=new Set([...deps.get(d.id)!].map(id=>byId.get(id)!.tag).concat([...calendar.get(d.id)!]));
  if(expected.size!==actual.size||[...expected].some(tag=>!actual.has(tag)))
   throw new DependencyGraphError("formula_mismatch",d.id);
 }
 const indegree=new Map([...deps].map(([id,items])=>[id,items.size]));
 const sorted=[...byId.keys()].sort((a,b)=>compare(byId.get(a)!.tag,byId.get(b)!.tag));
 const ranks=new Map(sorted.map((id,i)=>[id,i]));
 const heap:string[]=[];
 const push=(id:string)=>{heap.push(id);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(ranks.get(heap[p])!<=ranks.get(id)!)break;heap[i]=heap[p];i=p;}heap[i]=id;};
 const pop=():string=>{const top=heap[0],last=heap.pop()!;if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&ranks.get(heap[child+1])!<ranks.get(heap[child])!)child++;if(ranks.get(last)!<=ranks.get(heap[child])!)break;heap[i]=heap[child];i=child;}heap[i]=last;}return top;};
 for(const id of sorted)if(indegree.get(id)===0)push(id);
 const order:string[]=[];
 while(heap.length){
  const id=pop();order.push(id);
  for(const downstream of reverse.get(id)!){
   const remaining=indegree.get(downstream)!-1;indegree.set(downstream,remaining);
   if(remaining===0)push(downstream);
  }
 }
 if(order.length!==byId.size)throw new DependencyGraphError("cycle","indicator graph has a cycle");
 return {definitions:byId,byTag,dependencies:deps,dependents:reverse,calendarDependencies:calendar,order:Object.freeze(order)};
}
export function impactedIndicatorIds(graph:DependencyGraph,changedIndicatorIds:readonly string[],changedCalendarTags:readonly string[]=[]):readonly string[]{
 const impacted=new Set<string>(),queue:string[]=[];
 for(const id of changedIndicatorIds){
  if(!graph.definitions.has(id))throw new DependencyGraphError("unknown_indicator",id);
  if(!impacted.has(id)){impacted.add(id);queue.push(id);}
 }
 for(const tag of changedCalendarTags){
  if(!isCalendarSourceTag(tag))throw new DependencyGraphError("unknown_source",tag);
  for(const [id,tags] of graph.calendarDependencies)if(tags.has(tag)&&!impacted.has(id)){impacted.add(id);queue.push(id);}
 }
 for(let cursor=0;cursor<queue.length;cursor++){
  for(const id of graph.dependents.get(queue[cursor])??[]){
   if(!impacted.has(id)){impacted.add(id);queue.push(id);}
  }
 }
 return graph.order.filter(id=>impacted.has(id));
}
export type EvaluateDependenciesInput=Readonly<{
 graph:DependencyGraph;
 indicators:Readonly<Record<string,SourceValue>>;
 calendar:Readonly<Partial<Record<CalendarSourceTag,SourceValue>>>;
 changedIndicatorIds?:readonly string[];
 changedCalendarTags?:readonly string[];
 historical?: (indicatorId:string)=>HistoricalResolver;
}>;
export function evaluateDependencies(input:EvaluateDependenciesInput):ReadonlyMap<string,Result>{
 const {graph}=input;
 const order=input.changedIndicatorIds||input.changedCalendarTags?
  impactedIndicatorIds(graph,input.changedIndicatorIds??[],input.changedCalendarTags??[]):graph.order;
 const results=new Map<string,Result>(),byId=new Map<string,SourceValue>();
 let remainingOperations=MAX_CASCADE_OPERATIONS;
 for(const [id,value] of Object.entries(input.indicators))byId.set(id,value);
 for(const id of order){
  const definition=graph.definitions.get(id)!;
  if(definition.formula===null)continue;
  const sources:Record<string,SourceValue>=Object.create(null) as Record<string,SourceValue>;
  for(const upstream of graph.dependencies.get(id)??[]){
   const source=graph.definitions.get(upstream)!;
   const value=results.get(upstream);
   sources[source.tag]=value?(value.kind==="available"?value.value:{kind:"unavailable",reason:value.reason,sourceTag:value.sourceTag}):byId.get(upstream)??null;
  }
  for(const tag of graph.calendarDependencies.get(id)??[])sources[tag]=input.calendar[tag as CalendarSourceTag]??null;
  const ast=parseFormula(definition.formula);
  const pending:Expression[]=[ast];let requiredOperations=0;
  while(pending.length){const node=pending.pop()!;requiredOperations++;
   if(requiredOperations>remainingOperations)throw new FormulaBudgetError("cascade evaluation budget");
   if(node.kind==="binary")pending.push(node.left,node.right);
   else if(node.kind==="unary"||node.kind==="percent")pending.push(node.child);
   else if(node.kind==="call")pending.push(...node.args);
  }
  remainingOperations-=requiredOperations;
  const result=evaluateFormula(ast,sources,requiredOperations,input.historical?.(id));
  results.set(id,result);
  byId.set(id,result.kind==="available"?result.value:{kind:"unavailable",reason:result.reason,sourceTag:result.sourceTag});
 }
 return results;
}
export interface DependencyReader{query(sql:string):Promise<{rows:unknown[]}>;}
export async function loadDependencyGraph(client:DependencyReader):Promise<DependencyGraph>{
 const [defs,edges]=await Promise.all([
  client.query("SELECT id,tag,formula FROM public.smn_indicator_definition ORDER BY tag"),
  client.query("SELECT indicator_id,source_type,source_indicator_id,source_calendar_tag FROM public.smn_indicator_dependency ORDER BY indicator_id,source_type,source_indicator_id,source_calendar_tag")
 ]);
 return buildDependencyGraph(defs.rows as IndicatorDefinition[],edges.rows as DependencyRow[]);
}
