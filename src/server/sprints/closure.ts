import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintGoalsSchema} from "./goals";
import {ensureStoryPointsSchema} from "./story-points";
import {ensureActualDurationSchema} from "./actual-duration";
import {ensureExceptionalImpactSchema} from "./exceptional-capacity-impact";

export async function ensureClosureSchema(db:Client){
 await ensureSprintGoalsSchema(db);await ensureStoryPointsSchema(db);
 await ensureActualDurationSchema(db);await ensureExceptionalImpactSchema(db);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_closure_snapshot (
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 version integer NOT NULL CHECK(version>=1),
 snapshot jsonb NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 closed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(sprint_id,version))`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_closure_audit (
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 operation text NOT NULL CHECK(operation IN ('close','reopen')),
 previous_status text NOT NULL,next_status text NOT NULL,
 snapshot_version integer,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now())`);
}
async function sprintScope(db:Client,id:string,lock=false){
 const r=await db.query<{id:string;team_id:string;name:string;status:string;start_at:string;end_at:string}>(`SELECT s.id,s.team_id,s.name,s.status,s.start_at::text,s.end_at::text
 FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'
 ${lock?"FOR UPDATE OF s":""}`,[id]);return r.rows[0];
}
async function snapshot(db:Client,sprintId:string){
 const [goals,points,ceremonies,custom,exceptional,capacity,participants]=await Promise.all([
  db.query(`SELECT id,title,evaluation,comment,revision FROM public.smn_sprint_goal WHERE sprint_id=$1 ORDER BY created_at,id`,[sprintId]),
  db.query(`SELECT initial_sp::text,added_sp::text,removed_sp::text,done_sp::text,revision FROM public.smn_sprint_story_points WHERE sprint_id=$1`,[sprintId]),
  db.query(`SELECT id,kind,starts_at::text,ends_at::text,occurrence_status AS status,actual_minutes,generation_source FROM public.smn_sprint_ceremony WHERE sprint_id=$1`,[sprintId]),
  db.query(`SELECT id,template_id,template_revision,name,starts_at::text,ends_at::text,status,actual_minutes,generation_source FROM public.smn_scrum_template_occurrence WHERE sprint_id=$1`,[sprintId]),
  db.query(`SELECT id,name,starts_at::text,ends_at::text,status,actual_minutes,impacts_capacity FROM public.smn_sprint_exceptional_meeting WHERE sprint_id=$1`,[sprintId]),
  db.query(`SELECT
    (s.start_at AT TIME ZONE s.time_zone)::date::text AS start_on,
    (s.end_at AT TIME ZONE s.time_zone)::date::text AS end_on,
    (SELECT i.initial_jh::text FROM public.smn_capacity_initial_snapshot i
      JOIN public.smn_capacity_period_override p ON p.id=i.period_id
      WHERE p.team_id=s.team_id AND p.start_on=(s.start_at AT TIME ZONE s.time_zone)::date
      AND p.end_on=(s.end_at AT TIME ZONE s.time_zone)::date
      ORDER BY i.id DESC LIMIT 1) AS initial_jh,
    (SELECT a.retained_jh::text FROM public.smn_capacity_actual_snapshot a
      JOIN public.smn_capacity_period_override p ON p.id=a.period_id
      WHERE p.team_id=s.team_id AND p.start_on=(s.start_at AT TIME ZONE s.time_zone)::date
      AND p.end_on=(s.end_at AT TIME ZONE s.time_zone)::date
      ORDER BY a.closed_at DESC,a.id DESC LIMIT 1) AS actual_jh,
    (SELECT a.provenance FROM public.smn_capacity_actual_snapshot a
      JOIN public.smn_capacity_period_override p ON p.id=a.period_id
      WHERE p.team_id=s.team_id AND p.start_on=(s.start_at AT TIME ZONE s.time_zone)::date
      AND p.end_on=(s.end_at AT TIME ZONE s.time_zone)::date
      ORDER BY a.closed_at DESC,a.id DESC LIMIT 1) AS provenance
    FROM public.smn_sprint s WHERE s.id=$1`,[sprintId]),
  db.query(`SELECT p.meeting_id,p.member_id FROM public.smn_exceptional_meeting_participant p JOIN public.smn_sprint_exceptional_meeting m ON m.id=p.meeting_id WHERE m.sprint_id=$1 ORDER BY p.meeting_id,p.member_id`,[sprintId])
 ]);
 // Le décompte Tickets agrégé peut ne pas être installé sur les anciennes bases.
 // Une ancienne clôture conserve une absence de source plutôt qu'un faux zéro.
 const ticketsInstalled=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_sprint_ticket_counts') IS NOT NULL AS present");
 const ticket= ticketsInstalled.rows[0]?.present?
  await db.query(`SELECT initial_tickets::text,done_tickets::text
    FROM public.smn_sprint_ticket_counts WHERE sprint_id=$1`,[sprintId]):null;
 return {goals:goals.rows,storyPoints:points.rows[0]??null,
  ticketCounts:ticket?.rows[0]??null,
  ceremonies:ceremonies.rows,customMeetings:custom.rows,exceptionalMeetings:exceptional.rows,
  capacity:capacity.rows[0]??null,participants:participants.rows};
}
export async function listSprintClosures(db:Client,sprintId:string){
 await ensureClosureSchema(db);const sprint=await sprintScope(db,sprintId);if(!sprint)return null;
 const versions=await db.query(`SELECT id,version,closed_at::text AS "closedAt",actor_id AS "actorId",snapshot
 FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1 ORDER BY version DESC`,[sprintId]);
 return {sprint,latest:versions.rows[0]??null,versions:versions.rows};
}
export async function changeSprintClosure(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="action,sprintId"||!["close","reopen"].includes(String(v.action))||
 typeof v.sprintId!=="string"||!/^[a-f\d-]{36}$/i.test(v.sprintId))return {ok:false as const,error:"invalid-input"};
 await ensureClosureSchema(db);await db.query("BEGIN");
 try{
  const s=await sprintScope(db,v.sprintId,true);
  if(!s){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[s.team_id]);
  if(v.action==="close"&&(s.status!=="finished"||new Date(s.end_at)>new Date())||
     v.action==="reopen"&&s.status!=="closed"){
   await db.query("ROLLBACK");return {ok:false as const,error:"invalid-transition"};
  }
  let version:number|null=null;
  if(v.action==="close"){
   const num=await db.query<{next:number}>(`SELECT COALESCE(MAX(version),0)+1 AS next FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1`,[s.id]);
   version=Number(num.rows[0].next);
   const data=await snapshot(db,s.id);
   await db.query(`INSERT INTO public.smn_sprint_closure_snapshot(id,sprint_id,version,snapshot,actor_id)
    VALUES($1,$2,$3,$4::jsonb,$5)`,[randomUUID(),s.id,version,JSON.stringify({sprint:{id:s.id,name:s.name,startAt:s.start_at,endAt:s.end_at},...data}),actorId]);
  }
  const target=v.action==="close"?"closed":"finished";
  await db.query("UPDATE public.smn_sprint SET status=$2 WHERE id=$1",[s.id,target]);
  await db.query(`INSERT INTO public.smn_sprint_closure_audit(id,sprint_id,operation,previous_status,next_status,snapshot_version,actor_id)
   VALUES($1,$2,$3,$4,$5,$6,$7)`,[randomUUID(),s.id,v.action,s.status,target,version,actorId]);
  await db.query("COMMIT");return {ok:true as const,status:target,version};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
