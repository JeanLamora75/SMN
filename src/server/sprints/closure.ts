import {randomUUID} from "node:crypto";
import {qualitativeClosureSnapshot} from "@/server/registries/closure-snapshot";
import type {Client} from "pg";
import {ensureSprintGoalsSchema} from "./goals";
import {ensureStoryPointsSchema} from "./story-points";
import {ensureActualDurationSchema} from "./actual-duration";
import {ensureExceptionalImpactSchema} from "./exceptional-capacity-impact";
import {ensureSprintScoresSchema} from "./sprint-scores";
import {ensureSprintCapacityKpiSchema} from "./sprint-capacity-kpis";
import {readSprintMemberPresence} from "./presence-detail-read";
import {ensureSprintReviewSchema,reviewClosureSnapshot} from "./review-analysis";

export async function ensureClosureSchema(db:Client){
 await ensureSprintGoalsSchema(db);await ensureStoryPointsSchema(db);
 await ensureActualDurationSchema(db);await ensureExceptionalImpactSchema(db);
 await ensureSprintScoresSchema(db);
 await ensureSprintCapacityKpiSchema(db);
 await ensureSprintReviewSchema(db);
 await db.query("SELECT to_regclass('public.smn_sprint_closure_snapshot') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
 await db.query("SELECT to_regclass('public.smn_sprint_closure_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
}
async function sprintScope(db:Client,id:string,lock=false){
 const r=await db.query<{id:string;team_id:string;name:string;status:string;start_at:string;end_at:string;time_zone:string}>(`SELECT s.id,s.team_id,s.name,s.status,s.start_at::text,s.end_at::text,s.time_zone
 FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'
 ${lock?"FOR UPDATE OF s":""}`,[id]);return r.rows[0];
}
async function snapshot(db:Client,sprintId:string,context:{team_id:string;name:string;start_at:string;end_at:string;time_zone:string},historical=false){
 const [goals,points,ceremonies,custom,exceptional,capacity,participants,scores]=await Promise.all([
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
  db.query(`SELECT p.meeting_id,p.member_id FROM public.smn_exceptional_meeting_participant p JOIN public.smn_sprint_exceptional_meeting m ON m.id=p.meeting_id WHERE m.sprint_id=$1 ORDER BY p.meeting_id,p.member_id`,[sprintId]),
  db.query(`SELECT confidence,clarity,revision FROM public.smn_sprint_scores WHERE sprint_id=$1`,[sprintId])
 ]);
 // Le décompte Tickets agrégé peut ne pas être installé sur les anciennes bases.
 // Une ancienne clôture conserve une absence de source plutôt qu'un faux zéro.
 const ticketsInstalled=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_sprint_ticket_counts') IS NOT NULL AS present");
 const ticket= ticketsInstalled.rows[0]?.present?
  await db.query(`SELECT initial_tickets::text,done_tickets::text
    FROM public.smn_sprint_ticket_counts WHERE sprint_id=$1`,[sprintId]):null;
 // Capture member presence at closure. Never recompute this section from future
 // calendar/absence edits. A missing producer remains visibly unavailable.
 const reviewAnalysis=await reviewClosureSnapshot(db,sprintId);
 const qualitative=historical?{state:"historical-unavailable",capturedAt:new Date().toISOString(),items:[],relations:[],facts:[],explanation:"Aucune photographie qualitative passée attestée. Les registres actuels ne sont pas reproduits."}:await qualitativeClosureSnapshot(db,sprintId,context.team_id);
 const memberPresence=historical?null:await readSprintMemberPresence(db,context.team_id,{
  id:sprintId,name:context.name,status:"finished",suspended:false,
  startAt:context.start_at,endAt:context.end_at,timeZone:context.time_zone
 });
 const capacityKpi=await db.query<{planned_jh:string|null;actual_jh:string|null}>(
  "SELECT planned_jh::text,actual_jh::text FROM public.smn_sprint_capacity_kpi WHERE sprint_id=$1",
  [sprintId]);
 const saved=capacityKpi.rows[0]??null;
 const historicalTables=historical?await db.query<{planned:boolean;actual:boolean}>(`SELECT to_regclass('public.smn_sprint_historical_capacity') IS NOT NULL AS planned,
  to_regclass('public.smn_sprint_historical_actual_capacity') IS NOT NULL AS actual`):null;
 const historicalCapacity=historicalTables?.rows[0]?.planned?
  await db.query<{quality:string;qualified_jh:string|null}>(`SELECT quality,qualified_jh::text FROM public.smn_sprint_historical_capacity WHERE sprint_id=$1`,[sprintId]):null;
 const historicalActual=historicalTables?.rows[0]?.actual?
  await db.query<{quality:string;qualified_jh:string|null}>(`SELECT quality,qualified_jh::text FROM public.smn_sprint_historical_actual_capacity WHERE sprint_id=$1`,[sprintId]):null;
 const captured=capacity.rows[0]??null;
 const snapshotCapacity=historical?{initial_jh:historicalCapacity?.rows[0]?.qualified_jh??null,actual_jh:historicalActual?.rows[0]?.qualified_jh??null,initialQuality:historicalCapacity?.rows[0]?.quality??"not-supplied",actualQuality:historicalActual?.rows[0]?.quality??"not-supplied",provenance:"retrospective-manual"}:captured?{
  ...captured,
  initial_jh:saved?.planned_jh??captured.initial_jh,
  actual_jh:saved?.actual_jh??captured.actual_jh
 }:saved?{initial_jh:saved.planned_jh,actual_jh:saved.actual_jh}:null;
 return {goals:goals.rows,qualitative,storyPoints:points.rows[0]??null,
  memberPresence:historical?{state:"historical-unavailable",reason:"no-contemporaneous-evidence"}:memberPresence??{state:"unavailable",reason:"read-failed"},
  reviewAnalysis,
  confidenceClarity:scores.rows[0]??null,
  ticketCounts:ticket?.rows[0]??null,
  ceremonies:ceremonies.rows,customMeetings:custom.rows,exceptionalMeetings:exceptional.rows,
  capacity:snapshotCapacity,capacityKpis:historical?{planned:historicalCapacity?.rows[0]?.qualified_jh??null,actual:historicalActual?.rows[0]?.qualified_jh??null}:saved?{
   planned:saved.planned_jh,actual:saved.actual_jh
  }:null,participants:participants.rows};
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
   const historicalMarker=await db.query<{historical:boolean}>(`SELECT EXISTS(SELECT 1 FROM public.smn_sprint_audit WHERE sprint_id=$1 AND action='historical-created') AS historical`,[s.id]);
   const historical=historicalMarker.rows[0]?.historical===true;
   const data=await snapshot(db,s.id,s,historical);
   if(historical){
    const auditTable=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_historical_csv_change') IS NOT NULL AS present");
    const qualities=auditTable.rows[0]?.present?await db.query<{metric_code:string;quality:string}>(`SELECT DISTINCT ON(metric_code) metric_code,quality
     FROM public.smn_historical_csv_change WHERE cycle_id=$1
     ORDER BY metric_code,changed_at DESC,id DESC`,[s.id]):{rows:[]};
    Object.assign(data,{historicalMetricQualities:Object.fromEntries(qualities.rows.map(x=>[x.metric_code,x.quality]))});
   }

   // A new closure always appends a version; prior snapshots remain immutable.
   const timestamp=await db.query<{recorded_at:string}>(`SELECT clock_timestamp()::text AS recorded_at`);
   if(historical)Object.assign(data,{historicalClosure:{state:"partial-retrospective",
    recordedAt:timestamp.rows[0].recorded_at,version,priorVersions:version-1,
    historicRegistryState:"historical-unavailable",
    limitations:"Informations reprises rétrospectivement ; absence de données non assimilée à zéro ou non atteint."}});
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
