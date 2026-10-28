import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import type {SprintScores} from "@/lib/sprint-indicator-values";

const valid=(x:unknown)=>x===null||(typeof x==="number"&&
 Number.isInteger(x)&&x>=1&&x<=5);

/** Called on explicit admin save (or pre-closure preparation), never by readers. */
export async function ensureSprintScoresSchema(db:Client){
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_scores(
  sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
  confidence smallint CHECK(confidence BETWEEN 1 AND 5),
  clarity smallint CHECK(clarity BETWEEN 1 AND 5),
  revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL
 )`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_scores_audit(
  id text PRIMARY KEY,
  sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
  before_values jsonb,
  after_values jsonb NOT NULL,
  actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
 )`);
}

/** Latest per-sprint 1–5 measures with immutable per-revision audit history. */
export async function writeSprintScores(db:Client,actorId:string,raw:unknown,
 access?:{actor:TeamActor;teamId:string}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="revision,scores,sprintId"||
  typeof v.sprintId!=="string"||!/^[a-f\d-]{36}$/i.test(v.sprintId)||
  !Number.isSafeInteger(v.revision)||Number(v.revision)<0||
  !v.scores||typeof v.scores!=="object"||Array.isArray(v.scores))
  return {ok:false as const,error:"invalid-input" as const};
 const scores=v.scores as Record<string,unknown>;
 if(Object.keys(scores).sort().join(",")!=="clarity,confidence"||
  !valid(scores.confidence)||!valid(scores.clarity))
  return {ok:false as const,error:"invalid-input" as const};
 const values=scores as SprintScores;
 await db.query("BEGIN");
 try{
  const team=access?await resolveAdminTeam(db,access.actor,access.teamId):null;
  if(access&&(access.actor.accountId!==actorId||team?.mode!=="scrum"))
   throw Error("team-access-forbidden");
  const criterion=team?
   "AND s.team_id=$2 AND i.schema_version IN (28,29,30) AND lower(t.agile_mode)='scrum' AND t.is_archived=false":
   "AND i.schema_version<=27 AND lower(i.mode)='scrum'";
  const found=await db.query<{id:string;status:string}>(`
   SELECT s.id,s.status FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton'
    AND i.state='initialized' ${criterion}
   FOR UPDATE OF s
  `,team?[v.sprintId,team.team_id]:[v.sprintId]);
  const sprint=found.rows[0];
  if(!sprint){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(sprint.status==="closed"){
   await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};
  }
  await ensureSprintScoresSchema(db);
  const before=await db.query<{
   confidence:number|null;clarity:number|null;revision:number
  }>(`
   SELECT confidence,clarity,revision FROM public.smn_sprint_scores
   WHERE sprint_id=$1 FOR UPDATE
  `,[v.sprintId]);
  const prior=before.rows[0];
  if((prior?.revision??0)!==v.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  if(prior){
   await db.query(`UPDATE public.smn_sprint_scores SET
    confidence=$2,clarity=$3,revision=revision+1,updated_by=$4,updated_at=now()
    WHERE sprint_id=$1`,[v.sprintId,values.confidence,values.clarity,actorId]);
  }else{
   await db.query(`INSERT INTO public.smn_sprint_scores
    (sprint_id,confidence,clarity,updated_by)
    VALUES($1,$2,$3,$4)`,
    [v.sprintId,values.confidence,values.clarity,actorId]);
  }
  await db.query(`INSERT INTO public.smn_sprint_scores_audit
   (id,sprint_id,before_values,after_values,actor_id)
   VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,
   [randomUUID(),v.sprintId,prior?JSON.stringify({
    confidence:prior.confidence,clarity:prior.clarity}):null,
    JSON.stringify(values),actorId]);
  await db.query("COMMIT");
  return {ok:true as const,revision:Number(v.revision)+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
