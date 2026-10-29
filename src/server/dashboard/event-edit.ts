import {assertDashboardTable} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureActualDurationSchema} from "@/server/sprints/actual-duration";

export type EditableEventKind="template"|"ceremony"|"exceptional";
const ids=/^[0-9a-f-]{36}$/i;
const tables={
 template:{table:"smn_scrum_template_occurrence",title:"name",status:"status"},
 ceremony:{table:"smn_sprint_ceremony",title:"kind",status:"occurrence_status"},
 exceptional:{table:"smn_sprint_exceptional_meeting",title:"name",status:"status"}
} as const;
export function validDashboardEventKind(value:string):value is EditableEventKind {
 return Object.hasOwn(tables,value);
}
type Row={id:string;title:string;startAt:string;endAt:string;status:string;
 duration:number;teamId:string;sprintId:string;sprintStatus:string;
 sprintStart:string;sprintEnd:string;revision:number|null;actualMinutes:number|null;};
async function findEvent(db:Client,kind:EditableEventKind,id:string,lock=false):Promise<Row|null>{
 if(!ids.test(id))return null;
 const config=tables[kind];
 const metadata=await db.query<{column_name:string}>(`SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name=$1`,[config.table]);
 const columns=new Set(metadata.rows.map(r=>r.column_name));
 const essential=["id","sprint_id","starts_at","ends_at",config.title];
 if(!essential.every(x=>columns.has(x)))return null;
 const status=columns.has(config.status)?`COALESCE(e.${config.status},'unknown')`:"'unknown'::text";
 const minutes=columns.has("minutes")?"e.minutes":columns.has("duration_minutes")?
  "e.duration_minutes":"round(EXTRACT(EPOCH FROM (e.ends_at-e.starts_at))/60)::int";
 const revision=columns.has("revision")?"e.revision":"NULL::int";
 const actual=columns.has("actual_minutes")?"e.actual_minutes":"NULL::integer";
 const result=await db.query<{id:string;title:string;start_at:string;end_at:string;
  status:string;duration:number;team_id:string;sprint_id:string;
  sprint_status:string;sprint_start:string;sprint_end:string;revision:number|null;
  actual_minutes:number|null}>(`
 SELECT e.id,e.${config.title} AS title,e.starts_at::text AS start_at,
 e.ends_at::text AS end_at,${status} AS status,${minutes} AS duration,
 s.team_id,s.id AS sprint_id,s.status AS sprint_status,
 s.start_at::text AS sprint_start,s.end_at::text AS sprint_end,${revision} AS revision,
 ${actual} AS actual_minutes
 FROM public.${config.table} e JOIN public.smn_sprint s ON s.id=e.sprint_id
 JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE e.id=$1 AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode)='scrum' AND s.deleted_at IS NULL
 ${lock?"FOR UPDATE OF e,s":""}`,[id]);
 const r=result.rows[0];if(!r)return null;
 return {id:r.id,title:r.title,startAt:new Date(r.start_at).toISOString(),
  endAt:new Date(r.end_at).toISOString(),status:r.status,
  duration:r.duration,teamId:r.team_id,sprintId:r.sprint_id,
  sprintStatus:r.sprint_status,sprintStart:r.sprint_start,
  sprintEnd:r.sprint_end,revision:r.revision,actualMinutes:r.actual_minutes??null};
}
export async function readDashboardEvent(db:Client,kind:EditableEventKind,id:string,
 teamId:string,sprintId:string){
 if(!teamId||!ids.test(sprintId))return null;
 const row=await findEvent(db,kind,id);
 if(!row||row.teamId!==teamId||row.sprintId!==sprintId)return null;
 return {id:row.id,kind,title:row.title,startsAt:row.startAt,endsAt:row.endAt,
  duration:row.duration,actualMinutes:row.actualMinutes,
  status:row.status,editable:row.sprintStatus!=="closed"};
}
type Input={teamId:string;sprintId:string;title:string;startAt:string;duration:number;
 status:"scheduled"|"held"|"not_held"|"cancelled";
 expectedTitle:string;expectedStartAt:string;expectedEndAt:string;expectedStatus:string;
 actualMinutes?:number|null;expectedActualMinutes?:number|null};
function parseInput(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const o=raw as Record<string,unknown>;
 const allowed=[
  "teamId","sprintId","title","startAt","duration","status",
  "expectedTitle","expectedStartAt","expectedEndAt","expectedStatus",
  "actualMinutes","expectedActualMinutes"
 ];
 if(Object.keys(o).some(k=>!allowed.includes(k))||
  (o.actualMinutes===undefined)!==(o.expectedActualMinutes===undefined))return null;
 const minutesValid=(v:unknown)=>v===null||(Number.isSafeInteger(v)&&
  Number(v)>=0&&Number(v)<=1440);
 if(o.actualMinutes!==undefined&&
  (!minutesValid(o.actualMinutes)||!minutesValid(o.expectedActualMinutes)))return null;
 if(typeof o.teamId!=="string"||!o.teamId||
  typeof o.sprintId!=="string"||!ids.test(o.sprintId)||
  typeof o.title!=="string"||!o.title.trim()||o.title.trim().length>160||
  typeof o.startAt!=="string"||!Number.isFinite(Date.parse(o.startAt))||
  !Number.isSafeInteger(o.duration)||Number(o.duration)<1||Number(o.duration)>600||
  !["scheduled","held","not_held","cancelled"].includes(String(o.status))||
  ["expectedTitle","expectedStartAt","expectedEndAt","expectedStatus"].some(k=>typeof o[k]!=="string"))
  return null;
 return {teamId:o.teamId as string,sprintId:o.sprintId as string,
  title:o.title as string,startAt:o.startAt as string,duration:o.duration as number,
  status:o.status as Input["status"],expectedTitle:o.expectedTitle as string,
  expectedStartAt:o.expectedStartAt as string,expectedEndAt:o.expectedEndAt as string,
  expectedStatus:o.expectedStatus as string,
  ...(o.actualMinutes!==undefined?{
   actualMinutes:o.actualMinutes as number|null,
   expectedActualMinutes:o.expectedActualMinutes as number|null
  }: {})};
}
/** Prevent declaring an upcoming meeting held (or moving a past held one into
 * the future), without blocking edits to an already recorded future status. */
export function futureAttendanceTransitionForbidden(
 previousStatus:string,previousEndAt:string,nextStatus:string,nextEndAt:string,
 now=Date.now()
):boolean{
 return (nextStatus==="held"||nextStatus==="not_held")&&
  Date.parse(nextEndAt)>now&&
  (previousStatus!==nextStatus||Date.parse(previousEndAt)<=now);
}

/** Edition de l'occurrence UNIQUEMENT, jamais des modèles/snapshots/équipes étrangères. */
export async function updateDashboardEvent(db:Client,actorId:string,
 kind:EditableEventKind,id:string,raw:unknown){
 const o=parseInput(raw);
 if(!actorId||!ids.test(id)||!o)return {ok:false as const,error:"invalid-input" as const};
 // Migration additive documentée : aucune modification de la lecture du dashboard.
 await ensureActualDurationSchema(db);
 await db.query("BEGIN");
 try{
  const prev=await findEvent(db,kind,id,true);
  if(!prev||prev.teamId!==o.teamId||prev.sprintId!==o.sprintId){
   await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};
  }
  if(prev.sprintStatus==="closed"){
   await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};
  }
  if(prev.startAt!==o.expectedStartAt||prev.endAt!==o.expectedEndAt||
     prev.title!==o.expectedTitle||prev.status!==o.expectedStatus||
     (o.actualMinutes!==undefined&&prev.actualMinutes!==o.expectedActualMinutes)){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  if(kind!=="ceremony"&&o.duration>480){
   await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input" as const};
  }
  if(kind==="ceremony"&&o.title!==prev.title){
   await db.query("ROLLBACK");return {ok:false as const,error:"immutable-type" as const};
  }
  const start=new Date(o.startAt),end=new Date(start.getTime()+o.duration*60000);
  if(!Number.isFinite(end.getTime())||start<new Date(prev.sprintStart)||
    end>new Date(prev.sprintEnd)){
   await db.query("ROLLBACK");return {ok:false as const,error:"outside-sprint" as const};
  }
  if(futureAttendanceTransitionForbidden(
    prev.status,prev.endAt,o.status,end.toISOString())){
   await db.query("ROLLBACK");return {ok:false as const,error:"not-yet-due" as const};
  }
  const changed=prev.startAt!==start.toISOString()||prev.endAt!==end.toISOString()||
   prev.title!==o.title.trim()||prev.status!==o.status||
   (o.actualMinutes!==undefined&&prev.actualMinutes!==o.actualMinutes);
  if(changed){
   const config=tables[kind];
   const fields=["starts_at=$2","ends_at=$3"];
   const values:(string|number|null)[]=[id,start.toISOString(),end.toISOString()];
   if(kind==="ceremony"||kind==="exceptional"){
    values.push(o.duration);
    fields.push((kind==="ceremony"?"minutes":"duration_minutes")+"=$"+values.length);
   }
   if(kind!=="ceremony"){values.push(o.title.trim());fields.push("name=$"+values.length);}
   if(o.actualMinutes!==undefined){
    values.push(o.actualMinutes as number|null);
    fields.push("actual_minutes=$"+values.length);
   }
   values.push(o.status);
   const statusParam="$"+values.length;
   fields.push(`${config.status}=${statusParam}`);
   fields.push(`status_explicit=CASE WHEN ${config.status} IS DISTINCT FROM ${statusParam}
    THEN true ELSE status_explicit END`);
   if(kind==="ceremony")fields.push("revision=revision+1","provenance='customized'");
   await db.query(`UPDATE public.${config.table} SET ${fields.join(",")}
    WHERE id=$1`,values);
   if(o.actualMinutes!==undefined&&o.actualMinutes!==null&&
      prev.actualMinutes!==o.actualMinutes){
    await db.query(`INSERT INTO public.smn_meeting_actual_duration_audit
     (id,kind,event_id,previous_minutes,new_minutes,planned_minutes,actor_id)
     VALUES($1,$2,$3,$4,$5,$6,$7)`,[
     randomUUID(),kind==="ceremony"?"standard":kind==="template"?"custom":"exceptional",
     id,prev.actualMinutes,o.actualMinutes,prev.duration,actorId
    ]);
   }
   if(kind==="ceremony"){
    await db.query("DELETE FROM public.smn_sprint_ceremony_segment WHERE ceremony_id=$1",[id]);
    await db.query(`INSERT INTO public.smn_sprint_ceremony_segment
     (ceremony_id,position,starts_at,ends_at,minutes) VALUES($1,1,$2,$3,$4)`,
     [id,start.toISOString(),end.toISOString(),o.duration]);
   }
   if(kind==="ceremony"&&prev.revision!==null){
    await db.query(`INSERT INTO public.smn_sprint_ceremony_history
     (id,ceremony_id,revision,previous_values,next_values,changed_by)
     VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
     [randomUUID(),id,prev.revision+1,JSON.stringify({startAt:prev.startAt,endAt:prev.endAt,
      minutes:prev.duration,status:prev.status}),JSON.stringify({startAt:start.toISOString(),
      endAt:end.toISOString(),minutes:o.duration,status:o.status}),actorId]);
   }
   if(prev.status!==o.status){
    const history=kind==="ceremony"?["smn_sprint_ceremony_status_history","ceremony_id"]:
     kind==="template"?["smn_scrum_template_occurrence_status_history","occurrence_id"]:
     ["smn_sprint_exceptional_meeting_status_history","meeting_id"];
    await db.query(`INSERT INTO public.${history[0]}
     (id,${history[1]},previous_status,next_status,actor_id)
     VALUES($1,$2,$3,$4,$5)`,[randomUUID(),id,prev.status,o.status,actorId]);
   }
   if(kind==="exceptional"){
    await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting_history
     (id,meeting_id,action,actor_id,details)
     VALUES($1,$2,'edited',$3,$4::jsonb)`,
     [randomUUID(),id,actorId,JSON.stringify({before:{title:prev.title,startAt:prev.startAt,
      endAt:prev.endAt,status:prev.status},after:{title:o.title.trim(),startAt:start.toISOString(),
      endAt:end.toISOString(),status:o.status}})]);
   }
   await assertDashboardTable(db,"smn_dashboard_event_edit_audit");
   await db.query(`INSERT INTO public.smn_dashboard_event_edit_audit
    (id,event_kind,event_id,before_values,after_values,actor_id)
    VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
    [randomUUID(),kind,id,JSON.stringify({title:prev.title,startAt:prev.startAt,endAt:prev.endAt,
      duration:prev.duration,actualMinutes:prev.actualMinutes,status:prev.status}),JSON.stringify({title:o.title.trim(),
      startAt:start.toISOString(),endAt:end.toISOString(),duration:o.duration,
      actualMinutes:o.actualMinutes===undefined?prev.actualMinutes:o.actualMinutes,status:o.status}),actorId]);
  }
  await db.query("COMMIT");return {ok:true as const,id,changed};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
