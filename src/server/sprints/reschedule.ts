import {randomUUID,createHash} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintSchema} from "./creation";
import {ensureExceptionalImpactSchema} from "./exceptional-capacity-impact";
import {readDevelopmentCapacity} from "@/server/capacity/engine";
type Input={sprintId:string;startAt:string;endAt:string;mode:"keep"|"recalculate"};
function localDay(value:string,zone:string){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;}
function parse(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="endAt,mode,sprintId,startAt"||typeof v.sprintId!=="string"||!/^[a-f\d-]{36}$/i.test(v.sprintId)||typeof v.startAt!=="string"||typeof v.endAt!=="string"||!["keep","recalculate"].includes(String(v.mode)))return null;
 const a=new Date(v.startAt),b=new Date(v.endAt);
 if(!Number.isFinite(a.valueOf())||!Number.isFinite(b.valueOf())||a>=b||a.toISOString()!==v.startAt||b.toISOString()!==v.endAt)return null;
 return v as Input;
}
async function scope(db:Client,id:string,locked=false){
 const r=await db.query<{id:string;team_id:string;start_at:string;end_at:string;status:string;time_zone:string}>(`SELECT s.id,s.team_id,s.start_at::text,s.end_at::text,s.status,s.time_zone FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND lower(i.mode)='scrum' AND i.state='initialized' AND i.schema_version<=27 ${locked?"FOR UPDATE OF s":""}`,[id]);return r.rows[0];
}
async function examine(db:Client,input:Input){
 const s=await scope(db,input.sprintId);
 if(!s)return {ok:false as const,error:"not-found"};
 if(s.status==="closed")return {ok:false as const,error:"closed-period"};
 const overlaps=await db.query(`SELECT id,name FROM public.smn_sprint WHERE team_id=$1 AND id<>$2 AND deleted_at IS NULL AND start_at<$4 AND end_at>$3`,[s.team_id,s.id,input.startAt,input.endAt]);
 if(overlaps.rows.length)return {ok:false as const,error:"sprint-overlap",overlaps:overlaps.rows};
 const protectedEvents=await db.query(`SELECT id,kind,starts_at::text AS "startAt",ends_at::text AS "endAt",occurrence_status AS status,provenance
 FROM public.smn_sprint_ceremony WHERE sprint_id=$1 AND (starts_at<$2 OR ends_at>$3)
 UNION ALL SELECT id,'custom',starts_at::text,ends_at::text,status,'template'
 FROM public.smn_scrum_template_occurrence WHERE sprint_id=$1 AND (starts_at<$2 OR ends_at>$3)
 UNION ALL SELECT id,'exceptional',starts_at::text,ends_at::text,status,'manual'
 FROM public.smn_sprint_exceptional_meeting WHERE sprint_id=$1 AND (starts_at<$2 OR ends_at>$3)`,[s.id,input.startAt,input.endAt]);
 return {ok:true as const,sprint:s,warnings:protectedEvents.rows,adjustments:[],mode:input.mode};
}
async function registryImpact(db:Client,sprintId:string,newStart:string,newEnd:string,zone:string){
 const found=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_registry_cycle_link') IS NOT NULL AS present`);
 if(!found.rows[0]?.present)return {preserved:true,items:[] as Array<{id:string;type:string;title:string;dueOn:string|null;outside:boolean}>};
 const rows=await db.query<{id:string;type:string;title:string;dueOn:string|null}>(`SELECT r.id,r.type,r.title,r.due_on::text AS "dueOn"
 FROM public.smn_registry_cycle_link l JOIN public.smn_registry_item r ON r.id=l.item_id
 WHERE l.sprint_id=$1 AND r.type IN ('risk','dependency') ORDER BY r.type,r.id`,[sprintId]);
 const start=localDay(newStart,zone),end=localDay(newEnd,zone);
 return {preserved:true,items:rows.rows.map(r=>({...r,outside:r.dueOn!==null&&(r.dueOn<start||r.dueOn>end)}))};
}
async function reviewImpact(db:Client,s:{id:string;team_id:string;status:string;start_at:string;end_at:string;time_zone:string},input:Input){
 const [goals,points,initial,manual]=await Promise.all([
  db.query<{count:string}>(`SELECT count(*)::text AS count FROM public.smn_sprint_goal WHERE sprint_id=$1`,[s.id]),
  db.query(`SELECT initial_sp::text AS initial,added_sp::text AS added,removed_sp::text AS removed,done_sp::text AS done FROM public.smn_sprint_story_points WHERE sprint_id=$1`,[s.id]),
  db.query(`SELECT initial_jh::float8 AS jh,provenance FROM public.smn_capacity_initial_snapshot i JOIN public.smn_capacity_period_override p ON p.id=i.period_id WHERE p.team_id=$1 AND p.start_on=$2::date AND p.end_on=$3::date LIMIT 1`,
   [s.team_id,localDay(s.start_at,s.time_zone),localDay(s.end_at,s.time_zone)]),
  db.query(`SELECT a.manual_jh::float8 AS jh FROM public.smn_capacity_actual_override a JOIN public.smn_capacity_period_override p ON p.id=a.period_id WHERE p.team_id=$1 AND p.start_on=$2::date AND p.end_on=$3::date LIMIT 1`,
   [s.team_id,localDay(s.start_at,s.time_zone),localDay(s.end_at,s.time_zone)])
 ]);
 const newStart=localDay(input.startAt,s.time_zone),newEnd=localDay(input.endAt,s.time_zone);
 let calculatedReferenceJh:number|null=null,missingSources:string[]=[];
 if(s.status==="active"||s.status==="finished"){
  try{
   const result=await readDevelopmentCapacity(db,newStart,newEnd,{externalTransaction:true,includeExceptionalImpact:true});
   calculatedReferenceJh=result.totalJh;
   missingSources=result.missing.map(m=>m.source);
  }catch{missingSources=["calculation-unavailable"];}
 }
 return {goalCount:Number(goals.rows[0]?.count??0),storyPoints:points.rows[0]??null,
  initialCapacityJh:initial.rows[0]?.jh??null,manualActualJh:manual.rows[0]?.jh??null,
  recalculatedReferenceJh:calculatedReferenceJh,missingSources,
  messages:["review-goals","review-story-points","review-capacity-reference"],
  initialAndManualPreserved:true};
}
export async function ensureRescheduleSchema(db:Client){
 await ensureSprintSchema(db);
 await ensureExceptionalImpactSchema(db);
 const check=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_sprint_reschedule_audit') IS NOT NULL AS present`);
 if(!check.rows[0]?.present)throw Error("legacy-reschedule-schema-not-ready: apply-legacy-sprint-reschedule-audit");
}
export async function previewReschedule(db:Client,raw:unknown){
 const input=parse(raw);if(!input)return {ok:false as const,error:"invalid-input"};
 await ensureRescheduleSchema(db);
 const result=await examine(db,input);
 if(!result.ok)return result;
 const impact=await reviewImpact(db,result.sprint,input);
 const registry=await registryImpact(db,result.sprint.id,input.startAt,input.endAt,result.sprint.time_zone);
 if(result.warnings.length)return {ok:false as const,error:"events-outside-new-period",warnings:result.warnings,impact,registry};
 // Recalculation is not offered until a protected-event-safe preview engine is implemented.
 if(input.mode==="recalculate")return {ok:false as const,error:"recalculation-not-supported",warnings:result.warnings};
 const token=createHash("sha256").update(JSON.stringify({input,oldStart:result.sprint.start_at,oldEnd:result.sprint.end_at,warnings:result.warnings})).digest("hex");
 return {...result,impact,registry,token};
}
export async function confirmReschedule(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const data=raw as Record<string,unknown>,input=parse(data.input);
 if(!input||input.mode!=="keep"||typeof data.token!=="string")return {ok:false as const,error:"invalid-input"};
 await ensureRescheduleSchema(db);await db.query("BEGIN");
 try{
  const original=await scope(db,input.sprintId,true);
  if(!original){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[original.team_id]);
  const checked=await examine(db,input);
  if(!checked.ok){await db.query("ROLLBACK");return checked;}
  if(checked.warnings.length){await db.query("ROLLBACK");return {ok:false as const,error:"events-outside-new-period",warnings:checked.warnings};}
  const token=createHash("sha256").update(JSON.stringify({input,oldStart:original.start_at,oldEnd:original.end_at,warnings:checked.warnings})).digest("hex");
  if(token!==data.token){await db.query("ROLLBACK");return {ok:false as const,error:"stale-preview"};}
  const impact=await reviewImpact(db,original,input);
  const registry=await registryImpact(db,original.id,input.startAt,input.endAt,original.time_zone);
  await db.query("UPDATE public.smn_sprint SET start_at=$2,end_at=$3 WHERE id=$1",[input.sprintId,input.startAt,input.endAt]);
  await db.query(`INSERT INTO public.smn_sprint_reschedule_audit(id,sprint_id,old_start,old_end,new_start,new_end,mode,actor_id)
  VALUES($1,$2,$3,$4,$5,$6,'keep',$7)`,[randomUUID(),input.sprintId,original.start_at,original.end_at,input.startAt,input.endAt,actorId]);
  await db.query("COMMIT");return {ok:true as const,warnings:checked.warnings,impact,registry};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
