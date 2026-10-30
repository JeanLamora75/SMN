import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {deriveStoryPoints} from "@/lib/sprint-indicator-values";
export {deriveStoryPoints} from "@/lib/sprint-indicator-values";
export type Points={initial:number|null;added:number|null;removed:number|null;done:number|null};
const valid=(x:unknown)=>x===null||(typeof x==="number"&&Number.isSafeInteger(x)&&x>=0&&x<=1000000000);

export async function ensureStoryPointsSchema(db:Client){
 await db.query("SELECT to_regclass('public.smn_sprint') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-core-schema-not-ready: apply-sprint-core-v32")});
 await db.query("SELECT to_regclass('public.smn_sprint_story_points') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
 await db.query("SELECT to_regclass('public.smn_sprint_story_points_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
}
async function scope(db:Client,id:string,lock=false,teamId?:string){
 const criterion=teamId?
  "AND s.team_id=$2 AND i.schema_version BETWEEN 28 AND 32 AND lower(t.agile_mode)='scrum' AND t.is_archived=false":
  "AND i.schema_version<=27 AND lower(to_jsonb(i)->>'mode')='scrum'";
 const r=await db.query<{id:string;status:string;name:string;start_at:string;end_at:string}>(`SELECT s.id,s.status,s.name,s.start_at::text,s.end_at::text FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton'
 AND i.state='initialized' ${criterion} ${lock?"FOR UPDATE OF s":""}`,teamId?[id,teamId]:[id]);
 return r.rows[0];
}
export async function readStoryPoints(db:Client,id:string,access?:{actor:TeamActor;teamId:string}){
 const team=access?await resolveAdminTeam(db,access.actor,access.teamId):null;
 if(team&&team.mode!=="scrum")return null;
 await ensureStoryPointsSchema(db);const sprint=await scope(db,id,false,team?.team_id);if(!sprint)return null;
 const r=await db.query<{initial:string|null;added:string|null;removed:string|null;done:string|null;revision:number}>(`SELECT initial_sp::text AS initial,added_sp::text AS added,removed_sp::text AS removed,done_sp::text AS done,revision
 FROM public.smn_sprint_story_points WHERE sprint_id=$1`,[id]);
 const d=r.rows[0],points:Points={initial:d?.initial==null?null:Number(d.initial),added:d?.added==null?null:Number(d.added),removed:d?.removed==null?null:Number(d.removed),done:d?.done==null?null:Number(d.done)};
 return {sprint,points,revision:d?.revision??0,derived:deriveStoryPoints(points)};
}
export async function writeStoryPoints(db:Client,actor:string,raw:unknown,
 access?:{actor:TeamActor;teamId:string}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="points,revision,sprintId"||typeof v.sprintId!=="string"||!/^[a-f\d-]{36}$/i.test(v.sprintId)||
 !Number.isInteger(v.revision)||Number(v.revision)<0||!v.points||typeof v.points!=="object"||Array.isArray(v.points))return {ok:false as const,error:"invalid-input"};
 const p=v.points as Record<string,unknown>;
 if(Object.keys(p).sort().join(",")!=="added,done,initial,removed"||![p.initial,p.added,p.removed,p.done].every(valid))return {ok:false as const,error:"invalid-input"};
 const values=p as Points;await ensureStoryPointsSchema(db);await db.query("BEGIN");
 try{
 const team=access?await resolveAdminTeam(db,access.actor,access.teamId):null;
 if(access&&(access.actor.accountId!==actor||team?.mode!=="scrum"))
  throw Error("team-access-forbidden");
 const sprint=await scope(db,v.sprintId,true,team?.team_id);
 if(!sprint){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 if(sprint.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period"};}
 const prior=await db.query<{initial_sp:string|null;added_sp:string|null;removed_sp:string|null;done_sp:string|null;revision:number}>(`SELECT initial_sp::text,added_sp::text,removed_sp::text,done_sp::text,revision
 FROM public.smn_sprint_story_points WHERE sprint_id=$1 FOR UPDATE`,[v.sprintId]);
 const before=prior.rows[0];
 if((before?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
 if(before){
  await db.query(`UPDATE public.smn_sprint_story_points SET initial_sp=$2,added_sp=$3,removed_sp=$4,done_sp=$5,
  revision=revision+1,updated_by=$6,updated_at=now() WHERE sprint_id=$1`,[v.sprintId,values.initial,values.added,values.removed,values.done,actor]);
 }else{
  await db.query(`INSERT INTO public.smn_sprint_story_points(sprint_id,initial_sp,added_sp,removed_sp,done_sp,updated_by)
  VALUES($1,$2,$3,$4,$5,$6)`,[v.sprintId,values.initial,values.added,values.removed,values.done,actor]);
 }
 await db.query(`INSERT INTO public.smn_sprint_story_points_audit(id,sprint_id,before_values,after_values,actor_id)
 VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[randomUUID(),v.sprintId,before?JSON.stringify(before):null,JSON.stringify(values),actor]);
 await db.query("COMMIT");
 return {ok:true as const,revision:Number(v.revision)+1,derived:deriveStoryPoints(values)};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
