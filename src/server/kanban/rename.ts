import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";
import {normalizePeriodName} from "./dates";
import {ensureKanbanPeriodTables} from "./periods";

export async function renameKanbanPeriod(db:Client,actorId:string,periodId:string,raw:unknown,
 access?:{actor:TeamActor;teamId:string}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const data=raw as Record<string,unknown>;
 if(Object.keys(data).join(",")!=="name")return {ok:false as const,error:"invalid-input" as const};
 const name=normalizePeriodName(data.name);
 if(!name||!periodId)return {ok:false as const,error:"invalid-name" as const};
 await ensureKanbanPeriodTables(db);
 await db.query("BEGIN");
 try{
  const team=access?await resolveAdminTeam(db,access.actor,access.teamId):null;
  if(access&&(access.actor.accountId!==actorId||team?.mode!=="kanban"))
   throw Error("team-access-forbidden");
  const constraint=team?
   "AND p.team_id=$2 AND i.schema_version IN (28,29,30) AND lower(t.agile_mode)='kanban' AND t.is_archived=false":
   "AND i.schema_version<=27 AND lower(i.mode)='kanban'";
  const r=await db.query<{id:string;name:string;team_id:string;status:string}>(`SELECT p.id,p.name,p.team_id,p.status FROM public.smn_kanban_period p
   JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE p.id=$1 AND i.id='singleton' AND i.state='initialized' ${constraint} AND p.deleted_at IS NULL FOR UPDATE OF p`,team?[periodId,team.team_id]:[periodId]);
  if(!r.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  const previous=r.rows[0];
  const duplicates=await db.query<{id:string}>(`SELECT id FROM public.smn_kanban_period
   WHERE team_id=$1 AND deleted_at IS NULL AND id<>$2 AND lower(name)=lower($3) LIMIT 1`,[previous.team_id,periodId,name]);
  const duplicateName=duplicates.rows.length>0;
  if(previous.name!==name){
   await db.query("UPDATE public.smn_kanban_period SET name=$2 WHERE id=$1",[periodId,name]);
   await db.query(`INSERT INTO public.smn_kanban_period_audit
    (id,period_id,action,details,actor_id) VALUES($1,$2,'renamed',$3::jsonb,$4)`,
    [randomUUID(),periodId,JSON.stringify({before:previous.name,after:name,status:previous.status}),actorId]);
  }
  await db.query("COMMIT");
  return {ok:true as const,id:periodId,name,duplicateName,changed:previous.name!==name};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
