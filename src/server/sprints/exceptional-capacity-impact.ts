import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureActualDurationSchema} from "./actual-duration";
export async function ensureExceptionalImpactSchema(db:Client){
 const names=["smn_exceptional_meeting_participant","smn_exceptional_meeting_participant_audit","smn_exceptional_capacity_impact_history"] as const;
 const found=await db.query<{present:string[]}>(`SELECT array_agg(relname)::text[] AS present FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])`,[names]);
 if(names.some(name=>!found.rows[0]?.present?.includes(name)))throw Error("ceremony-schema-not-ready: apply-ceremony-schema-v32");
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
 const members=await db.query<{id:string;displayName:string}>(`SELECT DISTINCT m.id,m.display_name AS "displayName" FROM public.smn_member m
 JOIN public.smn_member_assignment a ON a.member_id=m.id JOIN public.smn_team t ON t.id=a.team_id
 WHERE t.id=$1 AND m.installation_id='singleton' ORDER BY m.display_name,m.id`,[teamId]);
 const participants=await db.query<{meetingId:string;memberId:string}>(`SELECT p.meeting_id AS "meetingId",p.member_id AS "memberId" FROM public.smn_exceptional_meeting_participant p JOIN public.smn_sprint_exceptional_meeting m ON m.id=p.meeting_id JOIN public.smn_sprint s ON s.id=m.sprint_id WHERE s.team_id=$1`,[teamId]);
 return {meetings:meetings.rows.map((m:any)=>({...m,participantIds:participants.rows.filter(p=>p.meetingId===m.id).map(p=>p.memberId)})),members:members.rows};
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

export async function setExceptionalParticipants(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="id,memberIds"||typeof v.id!=="string"||
 !/^[0-9a-f-]{36}$/i.test(v.id)||!Array.isArray(v.memberIds)||v.memberIds.length>500||
 !v.memberIds.every(id=>typeof id==="string"&&/^[0-9a-f-]{36}$/i.test(id))||
 new Set(v.memberIds).size!==v.memberIds.length)return {ok:false as const,error:"invalid-input"};
 await ensureExceptionalImpactSchema(db);
 await db.query("BEGIN");
 try{
  const teamId=await team(db);
  const meeting=(await db.query<{status:string;start_on:string;end_on:string}>(`SELECT s.status,(m.starts_at AT TIME ZONE s.time_zone)::date::text AS start_on,
   (m.ends_at AT TIME ZONE s.time_zone)::date::text AS end_on
   FROM public.smn_sprint_exceptional_meeting m JOIN public.smn_sprint s ON s.id=m.sprint_id
   WHERE m.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL FOR UPDATE OF m,s`,[v.id,teamId])).rows[0];
  if(!meeting){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(meeting.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period"};}
  const requested=v.memberIds as string[];
  if(requested.length){
   const valid=await db.query<{id:string}>(`SELECT DISTINCT a.member_id AS id FROM public.smn_member_assignment a
    JOIN public.smn_member m ON m.id=a.member_id
    WHERE a.team_id=$1 AND m.installation_id='singleton' AND a.member_id=ANY($2::text[])
    AND a.start_on<=$4::date AND (a.end_on IS NULL OR a.end_on>=$3::date)`,[teamId,requested,meeting.start_on,meeting.end_on]);
   if(valid.rows.length!==requested.length){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-participant"};}
  }
  const previous=await db.query<{member_id:string}>(`SELECT member_id FROM public.smn_exceptional_meeting_participant WHERE meeting_id=$1 ORDER BY member_id FOR UPDATE`,[v.id]);
  const old=previous.rows.map(x=>x.member_id);
  const next=[...requested].sort();
  if(JSON.stringify(old)!==JSON.stringify(next)){
   await db.query("DELETE FROM public.smn_exceptional_meeting_participant WHERE meeting_id=$1",[v.id]);
   for(const id of next)await db.query("INSERT INTO public.smn_exceptional_meeting_participant(meeting_id,member_id) VALUES($1,$2)",[v.id,id]);
   await db.query(`INSERT INTO public.smn_exceptional_meeting_participant_audit(id,meeting_id,before_member_ids,after_member_ids,actor_id)
    VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[randomUUID(),v.id,JSON.stringify(old),JSON.stringify(next),actorId]);
  }
  await db.query("COMMIT");return {ok:true as const,memberIds:next};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
