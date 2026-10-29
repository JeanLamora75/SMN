import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintSchema} from "./creation";
export async function ensureExceptionalMeetingSchema(db:Client){
 const tables=["smn_sprint_exceptional_meeting","smn_sprint_exceptional_meeting_history"] as const;
 const state=await db.query<{present:string[]}>(`SELECT array_agg(c.relname)::text[] AS present FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname = ANY($1::text[]) AND c.relkind IN ('r','p')`,[tables]);
 if(tables.some(name=>!state.rows[0]?.present?.includes(name)))throw Error("ceremony-schema-not-ready: apply-ceremony-schema-v32");
}
async function teamId(db:Client){
 const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(r.rows.length!==1)throw Error("scrum-team-unavailable");return r.rows[0].id;
}
export async function exceptionalMeetings(db:Client){
 await ensureExceptionalMeetingSchema(db);const team=await teamId(db);
 const s=await db.query(`SELECT id,name,status,start_at::text AS "startAt",end_at::text AS "endAt"
 FROM public.smn_sprint WHERE team_id=$1 AND deleted_at IS NULL ORDER BY start_at DESC LIMIT 100`,[team]);
 const m=await db.query(`SELECT m.id,m.sprint_id AS "sprintId",m.name,m.status,m.starts_at::text AS "startAt",
 m.ends_at::text AS "endAt",m.duration_minutes AS "duration",m.created_at::text AS "createdAt"
 FROM public.smn_sprint_exceptional_meeting m JOIN public.smn_sprint s ON s.id=m.sprint_id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL ORDER BY m.starts_at DESC LIMIT 300`,[team]);
 return {sprints:s.rows,meetings:m.rows};
}
export async function createExceptionalMeeting(db:Client,actor:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="duration,name,sprintId,startAt"||
 typeof v.sprintId!=="string"||typeof v.name!=="string"||!v.name.trim()||v.name.trim().length>160||
 typeof v.startAt!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v.startAt)||
 !Number.isFinite(Date.parse(v.startAt))||!Number.isInteger(v.duration)||Number(v.duration)<1||Number(v.duration)>480)return {ok:false as const,error:"invalid-input" as const};
 await ensureExceptionalMeetingSchema(db);const team=await teamId(db);
 await db.query("BEGIN");
 try{
 const sr=await db.query<{id:string;status:string;start_at:string;end_at:string}>(`SELECT id,status,start_at::text,end_at::text FROM public.smn_sprint
 WHERE id=$1 AND team_id=$2 AND deleted_at IS NULL FOR UPDATE`,[v.sprintId,team]);
 const sprint=sr.rows[0];
 if(!sprint){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
 if(sprint.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
 const start=new Date(v.startAt),end=new Date(start.getTime()+Number(v.duration)*60000);
 if(start<new Date(sprint.start_at)||end>new Date(sprint.end_at)){await db.query("ROLLBACK");return {ok:false as const,error:"outside-sprint" as const};}
 const warnings=await db.query<{kind:string;name:string;start_at:string;end_at:string}>(`
 SELECT 'ceremony' AS kind,(s.name||' — '||c.kind) AS name,c.starts_at::text,c.ends_at::text
 FROM public.smn_sprint_ceremony c JOIN public.smn_sprint s ON s.id=c.sprint_id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL AND c.starts_at<$3 AND c.ends_at>$2
 UNION ALL
 SELECT 'template' AS kind,o.name,o.starts_at::text,o.ends_at::text
 FROM public.smn_scrum_template_occurrence o JOIN public.smn_sprint s ON s.id=o.sprint_id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL AND o.starts_at<$3 AND o.ends_at>$2
 UNION ALL
 SELECT 'exceptional' AS kind,m.name,m.starts_at::text,m.ends_at::text
 FROM public.smn_sprint_exceptional_meeting m JOIN public.smn_sprint s ON s.id=m.sprint_id
 WHERE s.team_id=$1 AND s.deleted_at IS NULL AND m.starts_at<$3 AND m.ends_at>$2
 `,[team,start.toISOString(),end.toISOString()]);
 const id=randomUUID();
 await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting(id,sprint_id,name,starts_at,ends_at,duration_minutes,created_by)
 VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,v.sprintId,v.name.trim(),start.toISOString(),end.toISOString(),v.duration,actor]);
 await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting_history(id,meeting_id,action,actor_id,details)
 VALUES($1,$2,'created',$3,$4::jsonb)`,[randomUUID(),id,actor,JSON.stringify({name:v.name.trim(),startAt:start.toISOString(),endAt:end.toISOString(),duration:v.duration})]);
 await db.query("COMMIT");
 return {ok:true as const,id,warnings:warnings.rows};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function exceptionalMeetingHistory(db:Client,id:string){
 await ensureExceptionalMeetingSchema(db);const team=await teamId(db);
 const r=await db.query(`SELECT h.action,h.actor_id AS "actorId",h.occurred_at::text AS "occurredAt",h.details
 FROM public.smn_sprint_exceptional_meeting_history h
 JOIN public.smn_sprint_exceptional_meeting m ON m.id=h.meeting_id
 JOIN public.smn_sprint s ON s.id=m.sprint_id
 WHERE m.id=$1 AND s.team_id=$2 ORDER BY h.occurred_at DESC`,[id,team]);
 return r.rows;
}
