import type {Client} from "pg";
import {
 normalizeSprintCeremony,sortSprintCeremonies,ceremonyPage,
 type SprintCeremony,type CeremonySource
} from "@/lib/sprint-ceremony-detail";

type Reason="schema-missing"|"history-missing"|"read-failed";
export type SprintCeremoniesResult=
 |Readonly<{state:"available";source:"recorded-events"|"closure-snapshot";
  items:readonly SprintCeremony[];total:number;page:number;pageCount:number;
  pageSize:number;snapshotVersion:number|null;missingSources:readonly CeremonySource[]}>
 |Readonly<{state:"unavailable";reason:Reason}>;

const sources=[
 {table:"smn_sprint_ceremony",source:"standard",alias:"c"},
 {table:"smn_scrum_template_occurrence",source:"custom",alias:"o"},
 {table:"smn_sprint_exceptional_meeting",source:"exceptional",alias:"m"}
] as const;
const sourceKeys={
 standard:"ceremonies",custom:"customMeetings",exceptional:"exceptionalMeetings"
} as const;
const object=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;
const pageNumber=(page:number)=>Number.isSafeInteger(page)&&page>0?page:1;

/** L'historique provient exclusivement du JSONB Vn figé lors de la clôture. */
function snapshotResult(snapshot:unknown,version:number,requested:number):SprintCeremoniesResult{
 const data=object(snapshot);
 if(!data||Object.values(sourceKeys).some(key=>!Array.isArray(data[key])))
  return {state:"unavailable",reason:"history-missing"};
 const normalized:SprintCeremony[]=[];
 for(const {source} of sources){
  const key=sourceKeys[source];
  for(const entry of data[key] as unknown[]){
   const v=object(entry);
   if(!v)return {state:"unavailable",reason:"read-failed"};
   const item=normalizeSprintCeremony({
    source_kind:source,id:v.id,kind:source==="standard"?v.kind:null,
    title:source==="standard"?v.kind:v.name,
    starts_at:v.starts_at,ends_at:v.ends_at,status:v.status,
    generation_source:v.generation_source,
    status_explicit:null,
    planned_minutes:source==="standard"?v.minutes:
     source==="exceptional"?v.duration_minutes:null,
    actual_minutes:v.actual_minutes
   },true);
   if(!item)return {state:"unavailable",reason:"read-failed"};
   normalized.push(item);
  }
 }
 const page=ceremonyPage(sortSprintCeremonies(normalized),requested);
 return {state:"available",source:"closure-snapshot",snapshotVersion:version,
  missingSources:[],...page};
}
type Source=typeof sources[number];
function buildSelection(source:Source,columns:Set<string>):string{
 const a=source.alias;
 const optional=(name:string,expression:string,fallback:string)=>
  columns.has(name)?expression:fallback;
 const name=source.source==="standard"?a+".kind":a+".name";
 const kind=source.source==="standard"?a+".kind":"NULL::text";
 const statusCol=source.source==="standard"?"occurrence_status":"status";
 const status=optional(statusCol,`COALESCE(${a}.${statusCol},'unknown')`,"'unknown'::text");
 const evidence=optional("status_explicit",a+".status_explicit","NULL::boolean");
 const generation=optional("generation_source",a+".generation_source","NULL::text");
 const planned=source.source==="standard"?
  optional("minutes",a+".minutes","NULL::integer"):
  source.source==="exceptional"?
  optional("duration_minutes",a+".duration_minutes","NULL::integer"):
  `round(EXTRACT(EPOCH FROM (${a}.ends_at-${a}.starts_at))/60)::integer`;
 const actual=optional("actual_minutes",a+".actual_minutes","NULL::integer");
 // All identifiers come from the fixed, internal whitelist above.
 return `SELECT ${a}.id,'${source.source}'::text AS source_kind,
  ${kind} AS kind,${name} AS title,${a}.starts_at,${a}.ends_at,
  ${status} AS status,${evidence} AS status_explicit,
  ${generation} AS generation_source,
  ${planned} AS planned_minutes,${actual} AS actual_minutes
  FROM public.${source.table} ${a} WHERE ${a}.sprint_id=$1`;
}
const mandatory=(x:Source)=>x.source==="standard"?
 ["id","sprint_id","kind","starts_at","ends_at"]:
 ["id","sprint_id","name","starts_at","ends_at"];

/** Une seule équipe et un seul Sprint, transaction READ ONLY fournie par le caller.
 * Page SQL de 25 occurrences, sans limitation implicite à 5 ou 200. */
export async function readSprintDetailCeremonies(
 db:Client,teamId:string,sprintId:string,requestedPage=1
):Promise<SprintCeremoniesResult|null>{
 const scope=await db.query<{status:string}>(`
  SELECT s.status FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode))='scrum'
 `,[sprintId,teamId]);
 if(!scope.rows[0])return null;
 const requested=pageNumber(requestedPage);
 if(scope.rows[0].status==="closed"){
  const installed=await db.query<{present:boolean}>(`
   SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS present`);
  if(!installed.rows[0]?.present)
   return {state:"unavailable",reason:"history-missing"};
  const snapshots=await db.query<{version:number;snapshot:unknown}>(`
   SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
   WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprintId]);
  const latest=snapshots.rows[0];
  if(!latest||!Number.isSafeInteger(latest.version)||latest.version<1)
   return {state:"unavailable",reason:"history-missing"};
  return snapshotResult(latest.snapshot,latest.version,requested);
 }
 const registered=await db.query<{table_name:string;column_name:string}>(`
  SELECT table_name,column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name=ANY($1::text[])`,
  [sources.map(s=>s.table)]);
 const columns=new Map<string,Set<string>>();
 for(const row of registered.rows){
  if(!columns.has(row.table_name))columns.set(row.table_name,new Set());
  columns.get(row.table_name)!.add(row.column_name);
 }
 const missingSources:CeremonySource[]=[];
 const selections:string[]=[];
 for(const source of sources){
  const found=columns.get(source.table);
  if(!found||!mandatory(source).every(column=>found.has(column))){
   missingSources.push(source.source);continue;
  }
  selections.push(buildSelection(source,found));
 }
 if(!selections.length)return {state:"unavailable",reason:"schema-missing"};
 const union=selections.join(" UNION ALL ");
 const counts=await db.query<{total:string}>(`
  SELECT COUNT(*)::text AS total FROM (${union}) AS events`,[sprintId]);
 const total=Number(counts.rows[0]?.total);
 if(!Number.isSafeInteger(total)||total<0)
  return {state:"unavailable",reason:"read-failed"};
 const pageSize=25,pageCount=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(requested,pageCount);
 if(total===0)return {state:"available",source:"recorded-events",
  snapshotVersion:null,items:[],total,page,pageCount,pageSize,missingSources};
 const rows=await db.query<Record<string,unknown>>(`
  SELECT * FROM (${union}) AS events
  ORDER BY starts_at ASC,source_kind ASC,id ASC
  LIMIT $2 OFFSET $3`,[sprintId,pageSize,(page-1)*pageSize]);
 const items:SprintCeremony[]=[];
 for(const raw of rows.rows){
  const parsed=normalizeSprintCeremony(raw,false);
  if(!parsed)return {state:"unavailable",reason:"read-failed"};
  items.push(parsed);
 }
 return {state:"available",source:"recorded-events",snapshotVersion:null,
  items,total,page,pageCount,pageSize,missingSources};
}
