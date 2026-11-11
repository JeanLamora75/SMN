import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

/** Explicit, authorized write operation. The sprint index GET remains read-only. */
export async function reconcileScopedSprintStates(db:Client,actor:TeamActor,requestedTeamId:string|null){
 const team=await resolveAdminTeam(db,actor,requestedTeamId);
 if(team.mode!=="scrum")throw Error("sprint-team-not-scrum");
 // No DDL or implicit migration: fail safely when the state schema is absent.
 const schema=await db.query<{transitions:boolean;capacity:boolean;suspension:boolean}>(`
  SELECT to_regclass('public.smn_sprint_transition') IS NOT NULL AS transitions,
   to_regclass('public.smn_sprint_capacity_trigger') IS NOT NULL AS capacity,
   EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public'
    AND table_name='smn_sprint' AND column_name='auto_suspended') AS suspension`);
 if(!schema.rows[0]?.transitions||!schema.rows[0]?.capacity||!schema.rows[0]?.suspension)
  throw Error("sprint-state-schema-not-ready");
 await db.query("BEGIN");
 try{
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[team.team_id]);
  const started=await db.query<{id:string;start_at:Date}>(`
   UPDATE public.smn_sprint SET status='active'
   WHERE team_id=$1 AND deleted_at IS NULL AND auto_suspended=false
    AND status='planned' AND start_at<=now() AND end_at>now()
   RETURNING id,start_at`,[team.team_id]);
  const missed=await db.query<{id:string;start_at:Date}>(`
   SELECT id,start_at FROM public.smn_sprint
   WHERE team_id=$1 AND deleted_at IS NULL AND auto_suspended=false
    AND status='planned' AND end_at<=now()`,[team.team_id]);
  const ended=await db.query<{id:string;end_at:Date}>(`
   UPDATE public.smn_sprint SET status='finished'
   WHERE team_id=$1 AND deleted_at IS NULL AND auto_suspended=false
    AND status IN ('planned','active') AND end_at<=now()
   RETURNING id,end_at`,[team.team_id]);
  for(const sprint of [...started.rows,...missed.rows]){
   await db.query(`INSERT INTO public.smn_sprint_transition(id,sprint_id,transition,business_at)
    VALUES($1,$2,'started',$3) ON CONFLICT (sprint_id,transition) DO NOTHING`,
    [randomUUID(),sprint.id,sprint.start_at]);
   await db.query(`INSERT INTO public.smn_sprint_capacity_trigger(sprint_id,due_at)
    VALUES($1,$2) ON CONFLICT (sprint_id) DO NOTHING`,[sprint.id,sprint.start_at]);
  }
  for(const sprint of ended.rows)
   await db.query(`INSERT INTO public.smn_sprint_transition(id,sprint_id,transition,business_at)
    VALUES($1,$2,'ended',$3) ON CONFLICT (sprint_id,transition) DO NOTHING`,
    [randomUUID(),sprint.id,sprint.end_at]);
  await db.query("COMMIT");
  return {teamId:team.team_id,started:started.rowCount??started.rows.length,
   finished:ended.rowCount??ended.rows.length,missed:missed.rowCount??missed.rows.length};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
