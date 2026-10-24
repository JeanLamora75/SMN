import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureExceptionalMeetingSchema} from "./exceptional-meetings";
const uuid=/^[a-f0-9-]{36}$/i;
export function parseHistoricalEvent(raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const x=raw as Record<string,unknown>;
 if(Object.keys(x).sort().join(",")!=="duration,kind,name,sprintId,startAt,status"||
 typeof x.sprintId!=="string"||!uuid.test(x.sprintId)||typeof x.name!=="string"||
 !x.name.trim()||x.name.length>160||!["planning","daily","review","retrospective","other"].includes(String(x.kind))||
 !["unknown","held","not_held","cancelled"].includes(String(x.status))||
 typeof x.startAt!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x.startAt)||
 !Number.isFinite(Date.parse(x.startAt))||!Number.isInteger(x.duration)||Number(x.duration)<1||Number(x.duration)>480)return null;
 return {sprintId:x.sprintId,name:x.name.trim(),kind:x.kind as string,status:x.status as string,startAt:x.startAt,duration:x.duration as number};
}
export async function ensureHistoricalEventSchema(db:Client){
 await ensureExceptionalMeetingSchema(db);
 await db.query(`ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS generation_source text NOT NULL DEFAULT 'manual'`);
 await db.query(`ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_historical_event(
 meeting_id text PRIMARY KEY REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,
 kind text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`);
}
export async function createHistoricalEvent(db:Client,actorId:string,raw:unknown){
 const input=parseHistoricalEvent(raw);
 if(!actorId||!input)return {ok:false as const,error:"invalid-input"};
 await ensureHistoricalEventSchema(db);
 await db.query("BEGIN");
 try{
  const sprint=await db.query<{start_at:string;end_at:string;status:string}>(`SELECT s.start_at::text,s.end_at::text,s.status
  FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
  AND lower(i.mode)='scrum' FOR UPDATE OF s`,[input.sprintId]);
  const s=sprint.rows[0],endsAt=new Date(Date.parse(input.startAt)+input.duration*60000).toISOString();
  if(!s||s.status!=="finished"){await db.query("ROLLBACK");return {ok:false as const,error:"ineligible-sprint"};}
  if(Date.parse(input.startAt)<Date.parse(s.start_at)||Date.parse(endsAt)>Date.parse(s.end_at)||Date.parse(endsAt)>=Date.now()){
   await db.query("ROLLBACK");return {ok:false as const,error:"outside-sprint"};
  }
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting
   (id,sprint_id,name,starts_at,ends_at,duration_minutes,status,status_explicit,generation_source,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,'historical-documented',$9)`,
   [id,input.sprintId,input.name,input.startAt,endsAt,input.duration,input.status,input.status!=="unknown",actorId]);
  await db.query(`INSERT INTO public.smn_sprint_historical_event(meeting_id,kind) VALUES($1,$2)`,[id,input.kind]);
  await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting_history(id,meeting_id,action,actor_id,details)
  VALUES($1,$2,'historical-created',$3,$4::jsonb)`,[randomUUID(),id,actorId,JSON.stringify({...input,endsAt,provenance:"historical-documented",statusAttested:input.status!=="unknown"})]);
  await db.query("COMMIT");
  return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}

export async function correctHistoricalEvent(db:Client,actorId:string,meetingId:string,raw:unknown){
 if(!actorId||!uuid.test(meetingId)||!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input"};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="name,status"||typeof v.name!=="string"||
 !v.name.trim()||v.name.trim().length>160||
 !["unknown","held","not_held","cancelled"].includes(String(v.status)))return {ok:false as const,error:"invalid-input"};
 await ensureHistoricalEventSchema(db);
 await db.query("BEGIN");
 try{
  const old=await db.query<{id:string;name:string;status:string;sprint_status:string}>(`
  SELECT m.id,m.name,m.status,s.status AS sprint_status FROM public.smn_sprint_exceptional_meeting m
  JOIN public.smn_sprint_historical_event h ON h.meeting_id=m.id
  JOIN public.smn_sprint s ON s.id=m.sprint_id JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE m.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
  AND lower(i.mode)='scrum' FOR UPDATE OF m,s`,[meetingId]);
  const item=old.rows[0];
  if(!item){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(item.sprint_status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period"};}
  if(item.name!==v.name.trim()||item.status!==v.status){
   await db.query(`UPDATE public.smn_sprint_exceptional_meeting
    SET name=$2,status=$3,status_explicit=$4,revised_at=now() WHERE id=$1`,
    [meetingId,v.name.trim(),v.status,v.status!=="unknown"]);
   await db.query(`INSERT INTO public.smn_sprint_exceptional_meeting_history
    (id,meeting_id,action,actor_id,details) VALUES($1,$2,'historical-corrected',$3,$4::jsonb)`,
    [randomUUID(),meetingId,actorId,JSON.stringify({before:{name:item.name,status:item.status},after:{name:v.name.trim(),status:v.status}})]);
  }
  await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
