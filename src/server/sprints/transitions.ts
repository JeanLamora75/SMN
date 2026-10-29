import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintSchema} from "./creation";
import {assertLegacyTeamApi} from "@/server/teams/legacy";

export async function ensureSprintStateSchema(db:Client){
 await ensureSprintSchema(db);
 await db.query("ALTER TABLE public.smn_sprint ADD COLUMN IF NOT EXISTS auto_suspended boolean NOT NULL DEFAULT false");
 await db.query("SELECT to_regclass('public.smn_sprint_transition') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
 await db.query("SELECT to_regclass('public.smn_sprint_capacity_trigger') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
}
export async function reconcileSprintStates(db:Client){
 // Ne jamais exécuter la réconciliation monoéquipe ni sa DDL en v28.
 await assertLegacyTeamApi(db);
 await ensureSprintStateSchema(db);
 await db.query("BEGIN");
 try{
  const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
  if(team.rows.length!==1)throw Error("scrum-team-unavailable");
  const teamId=team.rows[0].id;
  await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[teamId]);
  const started=await db.query<{id:string;start_at:string}>(`UPDATE public.smn_sprint
   SET status='active' WHERE team_id=$1 AND deleted_at IS NULL AND status='planned'
   AND auto_suspended=false AND start_at<=now() AND end_at>now()
   RETURNING id,start_at::text`,[teamId]);
  for(const s of started.rows){
   await db.query(`INSERT INTO public.smn_sprint_transition(id,sprint_id,transition,business_at)
    VALUES($1,$2,'started',$3) ON CONFLICT (sprint_id,transition) DO NOTHING`,[randomUUID(),s.id,s.start_at]);
   await db.query(`INSERT INTO public.smn_sprint_capacity_trigger(sprint_id,due_at)
    VALUES($1,$2) ON CONFLICT (sprint_id) DO NOTHING`,[s.id,s.start_at]);
  }
  // Restored service: past planned Sprints are completed without pretending an opening took place.
  const missed=await db.query<{id:string;start_at:string}>(`SELECT id,start_at::text FROM public.smn_sprint
   WHERE team_id=$1 AND deleted_at IS NULL AND status='planned' AND auto_suspended=false AND end_at<=now()`,[teamId]);
  for(const s of missed.rows){
   await db.query(`INSERT INTO public.smn_sprint_transition(id,sprint_id,transition,business_at)
    VALUES($1,$2,'started',$3) ON CONFLICT (sprint_id,transition) DO NOTHING`,[randomUUID(),s.id,s.start_at]);
   await db.query(`INSERT INTO public.smn_sprint_capacity_trigger(sprint_id,due_at)
    VALUES($1,$2) ON CONFLICT (sprint_id) DO NOTHING`,[s.id,s.start_at]);
  }
  const ended=await db.query<{id:string;end_at:string}>(`UPDATE public.smn_sprint SET status='finished'
   WHERE team_id=$1 AND deleted_at IS NULL AND auto_suspended=false
   AND status IN ('planned','active') AND end_at<=now() RETURNING id,end_at::text`,[teamId]);
  for(const s of ended.rows){
   await db.query(`INSERT INTO public.smn_sprint_transition(id,sprint_id,transition,business_at)
    VALUES($1,$2,'ended',$3) ON CONFLICT (sprint_id,transition) DO NOTHING`,[randomUUID(),s.id,s.end_at]);
  }
  await db.query("COMMIT");
  return {started:started.rowCount??0,finished:ended.rowCount??0,missed:missed.rowCount??0};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function readSprintStates(db:Client){
 await reconcileSprintStates(db);
 const r=await db.query<{id:string;name:string;status:string;auto_suspended:boolean;start_at:string;end_at:string}>(`SELECT s.id,s.name,s.status,s.auto_suspended,s.start_at::text,s.end_at::text
 FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND lower(i.mode)='scrum' AND s.deleted_at IS NULL
 ORDER BY s.start_at DESC LIMIT 100`);
 return r.rows.map(s=>({id:s.id,name:s.name,status:s.status,suspended:s.auto_suspended,startAt:s.start_at,endAt:s.end_at}));
}
