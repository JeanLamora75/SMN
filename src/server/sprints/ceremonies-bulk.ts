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
 operation:"create"|"delete",expectedCount:number):
 Promise<{ok:true;count:number}|{ok:false;error:ErrorCode}>{
 if(!uuid.test(teamId)||!uuid.test(sprintId)||
  !["create","delete"].includes(operation)||!Number.isSafeInteger(expectedCount)||expectedCount<0)
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
  // The three source lists are scoped to the same locked sprint.
  const ids:Record<string,string[]>={};
  for(const source of sources){
   const result=await db.query<{id:string}>(`SELECT id FROM public.${source.table}
    WHERE sprint_id=$1 FOR UPDATE`,[sprintId]);
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
   await db.query(`DELETE FROM public.${source.table} WHERE sprint_id=$1`,[sprintId]);
  }
  await db.query("COMMIT");
  return {ok:true,count};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if(error&&typeof error==="object"&&"code" in error&&error.code==="23503")
   return {ok:false,error:"linked-data"};
  throw error;
 }
}
