import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureActualDurationSchema} from "./actual-duration";
export async function ensureExceptionalImpactSchema(db:Client){
 await ensureActualDurationSchema(db);
 await db.query("ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS impacts_capacity boolean NOT NULL DEFAULT false");
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_exceptional_capacity_impact_history (
  id text PRIMARY KEY,meeting_id text NOT NULL REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,
  previous_value boolean NOT NULL,new_value boolean NOT NULL,
  actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now())`);
}
async function team(db:Client){const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);if(r.rows.length!==1)throw Error("scrum-team-unavailable");return r.rows[0].id;}
export function proratedDeduction(durationMinutes:number,developerFraction:number,hoursPerJh=8){
 if(!Number.isFinite(durationMinutes)||durationMinutes<0||!Number.isFinite(developerFraction)||developerFraction<0||developerFraction>1||hoursPerJh<=0)throw Error("invalid-capacity-input");
 const minutes=Math.min(durationMinutes,1440)*developerFraction;
 return {minutes,jh:minutes/(hoursPerJh*60)};
}
export async function exceptionalCapacityImpact(db:Client){
 await ensureExceptionalImpactSchema(db);const teamId=await team(db);
 const meetings=await db.query(`SELECT m.id,m.name,m.sprint_id AS "sprintId",m.impacts_capacity AS "impactsCapacity",m.status,
 m.starts_at::text AS "startAt",m.ends_at::text AS "endAt",m.duration_minutes AS "plannedMinutes",
 COALESCE(m.actual_minutes,m.duration_minutes) AS "actualMinutes",s.status AS "sprintStatus"
 FROM public.smn_sprint_exceptional_meeting m JOIN public.smn_sprint s ON s.id=m.sprint_id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL ORDER BY m.starts_at DESC LIMIT 200`,[teamId]);
 return meetings.rows;
}
export async function setExceptionalCapacityImpact(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).sort().join(",")!=="id,impactsCapacity"||typeof o.id!=="string"||!/^[a-f0-9-]{36}$/i.test(o.id)||typeof o.impactsCapacity!=="boolean")return {ok:false as const,error:"invalid-input" as const};
 await ensureExceptionalImpactSchema(db);const teamId=await team(db);
 await db.query("BEGIN");
 try{
  const r=await db.query<{impacts_capacity:boolean;status:string}>(`SELECT m.impacts_capacity,s.status FROM public.smn_sprint_exceptional_meeting m
   JOIN public.smn_sprint s ON s.id=m.sprint_id WHERE m.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL FOR UPDATE OF m,s`,[o.id,teamId]);
  const row=r.rows[0];if(!row){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(row.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  if(row.impacts_capacity!==o.impactsCapacity){
   await db.query("UPDATE public.smn_sprint_exceptional_meeting SET impacts_capacity=$2 WHERE id=$1",[o.id,o.impactsCapacity]);
   await db.query(`INSERT INTO public.smn_exceptional_capacity_impact_history(id,meeting_id,previous_value,new_value,actor_id) VALUES($1,$2,$3,$4,$5)`,[randomUUID(),o.id,row.impacts_capacity,o.impactsCapacity,actorId]);
  }
  await db.query("COMMIT");return {ok:true as const,impactsCapacity:o.impactsCapacity};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
