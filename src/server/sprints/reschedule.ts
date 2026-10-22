import {randomUUID,createHash} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintSchema} from "./creation";
type Input={sprintId:string;startAt:string;endAt:string;mode:"keep"|"recalculate"};
function parse(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="endAt,mode,sprintId,startAt"||typeof v.sprintId!=="string"||!/^[a-f\d-]{36}$/i.test(v.sprintId)||typeof v.startAt!=="string"||typeof v.endAt!=="string"||!["keep","recalculate"].includes(String(v.mode)))return null;
 const a=new Date(v.startAt),b=new Date(v.endAt);
 if(!Number.isFinite(a.valueOf())||!Number.isFinite(b.valueOf())||a>=b||a.toISOString()!==v.startAt||b.toISOString()!==v.endAt)return null;
 return v as Input;
}
async function scope(db:Client,id:string,locked=false){
 const r=await db.query<{id:string;team_id:string;start_at:string;end_at:string;status:string}>(`SELECT s.id,s.team_id,s.start_at::text,s.end_at::text,s.status FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND lower(i.mode)='scrum' AND i.state='initialized' ${locked?"FOR UPDATE OF s":""}`,[id]);return r.rows[0];
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
export async function ensureRescheduleSchema(db:Client){
 await ensureSprintSchema(db);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_reschedule_audit(
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 old_start timestamptz NOT NULL,old_end timestamptz NOT NULL,new_start timestamptz NOT NULL,new_end timestamptz NOT NULL,
 mode text NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,occurred_at timestamptz NOT NULL DEFAULT now())`);
}
export async function previewReschedule(db:Client,raw:unknown){
 const input=parse(raw);if(!input)return {ok:false as const,error:"invalid-input"};
 await ensureRescheduleSchema(db);
 const result=await examine(db,input);
 if(!result.ok)return result;
 // Recalculation is not offered until a protected-event-safe preview engine is implemented.
 if(input.mode==="recalculate")return {ok:false as const,error:"recalculation-not-supported",warnings:result.warnings};
 const token=createHash("sha256").update(JSON.stringify({input,oldStart:result.sprint.start_at,oldEnd:result.sprint.end_at})).digest("hex");
 return {...result,token};
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
  const token=createHash("sha256").update(JSON.stringify({input,oldStart:original.start_at,oldEnd:original.end_at})).digest("hex");
  if(token!==data.token){await db.query("ROLLBACK");return {ok:false as const,error:"stale-preview"};}
  await db.query("UPDATE public.smn_sprint SET start_at=$2,end_at=$3 WHERE id=$1",[input.sprintId,input.startAt,input.endAt]);
  await db.query(`INSERT INTO public.smn_sprint_reschedule_audit(id,sprint_id,old_start,old_end,new_start,new_end,mode,actor_id)
  VALUES($1,$2,$3,$4,$5,$6,'keep',$7)`,[randomUUID(),input.sprintId,original.start_at,original.end_at,input.startAt,input.endAt,actorId]);
  await db.query("COMMIT");return {ok:true as const,warnings:checked.warnings};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
