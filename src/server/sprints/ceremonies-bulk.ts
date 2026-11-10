import type {Client} from "pg";
import {saveTemplateOccurrences,ensureTemplateOccurrenceSchema} from "./template-occurrences";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type ErrorCode="invalid-input"|"not-found"|"protected"|"state-changed"|"incomplete-schema"|"linked-data"|"no-templates";
const sources=[
 {table:"smn_sprint_ceremony",key:"ceremony"},
 {table:"smn_scrum_template_occurrence",key:"template"},
 {table:"smn_sprint_exceptional_meeting",key:"exceptional"}
] as const;
async function checkedSprint(db:Client,sprintId:string,teamId:string){
 const result=await db.query<{id:string;status:string;startAt:string;endAt:string;timeZone:string}>(`
  SELECT s.id,s.status,s.start_at::text AS "startAt",s.end_at::text AS "endAt",
    s.time_zone AS "timeZone"
  FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL AND
    i.id='singleton' AND i.state='initialized' AND
    COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false AND
    lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),i.mode))='scrum'
  FOR UPDATE OF s`,[sprintId,teamId]);
 return result.rows[0]??null;
}
async function verifyTables(db:Client){
 const needed=[
  ...sources.map(s=>s.table),
  "smn_sprint_ceremony_segment","smn_sprint_ceremony_history",
  "smn_sprint_ceremony_status_history",
  "smn_scrum_template_occurrence_status_history",
  "smn_sprint_exceptional_meeting_history",
  "smn_sprint_exceptional_meeting_status_history",
  "smn_exceptional_capacity_impact_history",
  "smn_exceptional_meeting_participant_audit",
  "smn_exceptional_meeting_participant",
  "smn_sprint_historical_event",
  "smn_calendar_meeting_outcome_link",
  "smn_calendar_meeting_schedule_history"
 ];
 const result=await db.query<{name:string}>(`SELECT table_name AS name FROM information_schema.tables
  WHERE table_schema='public' AND table_name=ANY($1::text[])`,[needed]);
 return needed.every(name=>result.rows.some(row=>row.name===name));
}
export const ceremonyDeleteTypes=[
 "planning","daily","review","retrospective","custom","exceptional"
] as const;
export type CeremonyDeleteType=(typeof ceremonyDeleteTypes)[number];
export function parseCeremonyDeleteTypes(raw:unknown):CeremonyDeleteType[]|null{
 if(!Array.isArray(raw)||raw.length===0||raw.length>ceremonyDeleteTypes.length||
  raw.some(v=>typeof v!=="string"||!ceremonyDeleteTypes.includes(v as CeremonyDeleteType))||
  new Set(raw).size!==raw.length)return null;
 return raw as CeremonyDeleteType[];
}
export async function readSprintCeremonyTypeCounts(db:Client,teamId:string,sprintId:string){
 const sprint=await checkedSprint(db,sprintId,teamId);
 if(!sprint)return null;
 if(!await verifyTables(db))return {state:"unavailable" as const};
 const result=await db.query<{type:CeremonyDeleteType;count:string}>(`
  SELECT kind AS type,COUNT(*)::text AS count FROM public.smn_sprint_ceremony
  WHERE sprint_id=$1 AND kind=ANY($2::text[]) GROUP BY kind
  UNION ALL SELECT 'custom' AS type,COUNT(*)::text AS count
  FROM public.smn_scrum_template_occurrence WHERE sprint_id=$1
  UNION ALL SELECT 'exceptional' AS type,COUNT(*)::text AS count
  FROM public.smn_sprint_exceptional_meeting WHERE sprint_id=$1`,
  [sprintId,ceremonyDeleteTypes.slice(0,4)]);
 const counts=Object.fromEntries(ceremonyDeleteTypes.map(type=>[type,0])) as Record<CeremonyDeleteType,number>;
 for(const row of result.rows){
  const n=Number(row.count);
  if(!ceremonyDeleteTypes.includes(row.type)||!Number.isSafeInteger(n)||n<0)
   return {state:"unavailable" as const};
  counts[row.type]=n;
 }
 return {state:"available" as const,counts};
}
async function countSources(db:Client,sprintId:string){
 const counts:number[]=[];
 for(const source of sources){
  const result=await db.query<{count:string}>(`SELECT COUNT(*)::text AS count FROM public.${source.table}
   WHERE sprint_id=$1`,[sprintId]);
  counts.push(Number(result.rows[0]?.count??"0"));
 }
 return counts.reduce((a,b)=>a+b,0);
}
/** All changes are in one DB transaction; frozen sprint snapshots are never edited. */
export async function changeSprintCeremonies(db:Client,teamId:string,sprintId:string,
 operation:"create"|"delete",expectedCount:number,selectedTypes?:readonly CeremonyDeleteType[],expectedSelectedCount?:number):
 Promise<{ok:true;count:number}|{ok:false;error:ErrorCode}>{
 if(!uuid.test(teamId)||!uuid.test(sprintId)||
  !["create","delete"].includes(operation)||!Number.isSafeInteger(expectedCount)||expectedCount<0||
  (operation==="delete"&&(!selectedTypes||!parseCeremonyDeleteTypes([...selectedTypes])))||
  (operation==="create"&&(selectedTypes!==undefined||expectedSelectedCount!==undefined))||
  (operation==="delete"&&(!Number.isSafeInteger(expectedSelectedCount)||Number(expectedSelectedCount)<1)))
  return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const sprint=await checkedSprint(db,sprintId,teamId);
  if(!sprint){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
  if(sprint.status==="closed"){
   await db.query("ROLLBACK");return {ok:false,error:"protected"};
  }
  if(!await verifyTables(db)){
   await db.query("ROLLBACK");return {ok:false,error:"incomplete-schema"};
  }
  const count=await countSources(db,sprintId);
  if(count!==expectedCount||operation==="create"&&count!==0||
    operation==="delete"&&count===0){
   await db.query("ROLLBACK");return {ok:false,error:"state-changed"};
  }
  if(operation==="create"){
   await ensureTemplateOccurrenceSchema(db);
   const generated=await saveTemplateOccurrences(db,{
    id:sprint.id,startAt:sprint.startAt,endAt:sprint.endAt,timeZone:sprint.timeZone
   },{schemaPrevalidated:true,reconstructed:new Date(sprint.endAt).getTime()<=Date.now()});
   if(generated===0){
    await db.query("ROLLBACK");return {ok:false,error:"no-templates"};
   }
   await db.query("COMMIT");
   return {ok:true,count:generated};
  }
  const selection=new Set(selectedTypes);
  const matching=await readSprintCeremonyTypeCounts(db,teamId,sprintId);
  if(!matching||matching.state!=="available"){
   await db.query("ROLLBACK");return {ok:false,error:"incomplete-schema"};
  }
  const selectedCount=ceremonyDeleteTypes.reduce((sum,type)=>
   sum+(selection.has(type)?matching.counts[type]:0),0);
  if(selectedCount===0||selectedCount!==expectedSelectedCount){
   await db.query("ROLLBACK");return {ok:false,error:"state-changed"};
  }
  // Only the explicitly selected kinds or source categories may be erased.

  const ids:Record<string,string[]>={};
  for(const source of sources){
   const types=ceremonyDeleteTypes.slice(0,4).filter(type=>selection.has(type));
   const enabled=source.key==="ceremony"?types.length>0:
    selection.has(source.key==="template"?"custom":"exceptional");
   if(!enabled){ids[source.key]=[];continue;}
   const condition=source.key==="ceremony"?" AND kind=ANY($2::text[])":"";
   const params=source.key==="ceremony"?[sprintId,types]:[sprintId];
   const result=await db.query<{id:string}>(`SELECT id FROM public.${source.table}
    WHERE sprint_id=$1${condition} FOR UPDATE`,params);
   ids[source.key]=result.rows.map(r=>r.id);
  }
  // Disassociate register items without deleting the register records themselves.
  for(const source of sources){
   await db.query(`DELETE FROM public.smn_calendar_meeting_outcome_link
    WHERE meeting_kind=$1 AND meeting_id=ANY($2::text[])`,[source.key,ids[source.key]]);
   await db.query(`DELETE FROM public.smn_calendar_meeting_schedule_history
    WHERE meeting_kind=$1 AND meeting_id=ANY($2::text[])`,[source.key,ids[source.key]]);
  }
  for(const table of ["smn_sprint_ceremony_segment","smn_sprint_ceremony_history",
    "smn_sprint_ceremony_status_history"]){
   await db.query(`DELETE FROM public.${table} WHERE ceremony_id=ANY($1::text[])`,[ids.ceremony]);
  }
  await db.query(`DELETE FROM public.smn_scrum_template_occurrence_status_history
    WHERE occurrence_id=ANY($1::text[])`,[ids.template]);
  for(const table of ["smn_sprint_exceptional_meeting_history",
    "smn_sprint_exceptional_meeting_status_history",
    "smn_exceptional_capacity_impact_history",
    "smn_exceptional_meeting_participant_audit",
    "smn_exceptional_meeting_participant","smn_sprint_historical_event"]){
   await db.query(`DELETE FROM public.${table} WHERE meeting_id=ANY($1::text[])`,[ids.exceptional]);
  }
  for(const source of sources){
   await db.query(`DELETE FROM public.${source.table} WHERE id=ANY($1::text[]) AND sprint_id=$2`,
    [ids[source.key],sprintId]);
  }
  await db.query("COMMIT");
  return {ok:true,count:selectedCount};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if(error&&typeof error==="object"&&"code" in error&&error.code==="23503")
   return {ok:false,error:"linked-data"};
  throw error;
 }
}
