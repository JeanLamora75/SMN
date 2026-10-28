import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {ensureSprintSchema} from "./creation";
import {recordConfirmedHighlight} from "@/server/registries/confirmed-highlights";
type Evaluation="not_evaluated"|"achieved"|"partially_achieved"|"not_achieved";
const statuses=new Set(["not_evaluated","achieved","partially_achieved","not_achieved"]);
export async function ensureSprintGoalsSchema(db:Client){
 await ensureSprintSchema(db);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_goal(
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 240),
 evaluation text NOT NULL DEFAULT 'not_evaluated' CHECK(evaluation IN ('not_evaluated','achieved','partially_achieved','not_achieved')),
 comment text,revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_goal_audit(
 id text PRIMARY KEY,goal_id text NOT NULL REFERENCES public.smn_sprint_goal(id) ON DELETE RESTRICT,
 previous_values jsonb,next_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now())`);
}
async function findSprint(db:Client,id:string,lock=false,teamId?:string){
 const criterion=teamId?
  "AND s.team_id=$2 AND i.schema_version IN (28,29,30) AND lower(t.agile_mode)='scrum' AND t.is_archived=false":
  "AND i.schema_version<=27 AND lower(i.mode)='scrum'";
 const r=await db.query<{id:string;name:string;status:string;start_at:string;end_at:string}>(`SELECT s.id,s.name,s.status,s.start_at::text,s.end_at::text FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' ${criterion}
 ${lock?"FOR UPDATE OF s":""}`,teamId?[id,teamId]:[id]);return r.rows[0];
}
export async function readSprintGoals(db:Client,sprintId:string,
 access?:{actor:TeamActor;teamId:string}){
 const team=access?await resolveAdminTeam(db,access.actor,access.teamId):null;
 if(team&&team.mode!=="scrum")return null;
 await ensureSprintGoalsSchema(db);
 const sprint=await findSprint(db,sprintId,false,team?.team_id);
 if(!sprint)return null;
 const goals=await db.query(`SELECT id,title,evaluation,comment,revision,created_at::text AS "createdAt",updated_at::text AS "updatedAt"
 FROM public.smn_sprint_goal WHERE sprint_id=$1 ORDER BY created_at,id`,[sprintId]);
 return {sprint:{id:sprint.id,name:sprint.name,status:sprint.status,startAt:sprint.start_at,endAt:sprint.end_at},goals:goals.rows};
}
export async function writeSprintGoal(db:Client,actorId:string,raw:unknown,
 access?:{actor:TeamActor;teamId:string}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).some(k=>!["sprintId","id","title","evaluation","comment","revision"].includes(k))||
 typeof v.sprintId!=="string"||!/^[a-f\d-]{36}$/i.test(v.sprintId)||
 typeof v.title!=="string"||!v.title.trim()||v.title.trim().length>240||
 typeof v.evaluation!=="string"||!statuses.has(v.evaluation)||
 v.comment!==null&&v.comment!==undefined&&(typeof v.comment!=="string"||v.comment.length>2000))
 return {ok:false as const,error:"invalid-input" as const};
 const updating=v.id!==undefined;
 if(updating&&(typeof v.id!=="string"||!/^[a-f\d-]{36}$/i.test(v.id)||!Number.isSafeInteger(v.revision)||Number(v.revision)<1))return {ok:false as const,error:"invalid-input" as const};
 if(!updating&&v.evaluation!=="not_evaluated")return {ok:false as const,error:"initial-status-required" as const};
 await ensureSprintGoalsSchema(db);await db.query("BEGIN");
 try{
  const team=access?await resolveAdminTeam(db,access.actor,access.teamId):null;
  if(access&&(access.actor.accountId!==actorId||team?.mode!=="scrum"))
   throw Error("team-access-forbidden");
  const sprint=await findSprint(db,v.sprintId,true,team?.team_id);
  if(!sprint){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(sprint.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  const id=updating?v.id as string:randomUUID();
  let previous:Record<string,unknown>|null=null;
  if(updating){
   const old=await db.query<{id:string;title:string;evaluation:Evaluation;comment:string|null;revision:number}>(`SELECT id,title,evaluation,comment,revision FROM public.smn_sprint_goal
    WHERE id=$1 AND sprint_id=$2 FOR UPDATE`,[id,v.sprintId]);
   if(!old.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
   if(old.rows[0].revision!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
   previous=old.rows[0];
   await db.query(`UPDATE public.smn_sprint_goal SET title=$2,evaluation=$3,comment=$4,revision=revision+1,updated_at=now() WHERE id=$1`,[id,v.title.trim(),v.evaluation,v.comment||null]);
  }else{
   await db.query(`INSERT INTO public.smn_sprint_goal(id,sprint_id,title,evaluation,comment,created_by) VALUES($1,$2,$3,'not_evaluated',$4,$5)`,[id,v.sprintId,v.title.trim(),v.comment||null,actorId]);
  }
  await db.query(`INSERT INTO public.smn_sprint_goal_audit(id,goal_id,previous_values,next_values,actor_id)
   VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[randomUUID(),id,previous?JSON.stringify(previous):null,JSON.stringify({title:v.title.trim(),evaluation:v.evaluation,comment:v.comment||null}),actorId]);
  if(updating&&previous?.evaluation!=="achieved"&&v.evaluation==="achieved")await recordConfirmedHighlight(db,{category:"achievedGoal",sourceKind:"goal",sourceId:id,sourceRevision:(previous?.revision as number)+1,title:v.title.trim(),actorId});
  await db.query("COMMIT");return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
