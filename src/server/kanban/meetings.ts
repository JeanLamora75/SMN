import {assertKanbanSchema} from "./schema-ready";
import {assertKanbanSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureKanbanPeriodTables} from "./periods";
export type KanbanMeetingInput={periodId:string;name:string;startAt:string;duration:number};
export function parseKanbanMeeting(raw:unknown):KanbanMeetingInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const x=raw as Record<string,unknown>;
 if(Object.keys(x).sort().join(",")!=="duration,name,periodId,startAt"||
 typeof x.periodId!=="string"||typeof x.name!=="string"||
 !x.name.trim()||x.name.trim().length>160||
 typeof x.startAt!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x.startAt)||
 !Number.isFinite(Date.parse(x.startAt))||!Number.isInteger(x.duration)||Number(x.duration)<1||Number(x.duration)>480)return null;
 return {periodId:x.periodId,name:x.name.trim(),startAt:x.startAt,duration:Number(x.duration)};
}
export async function ensureKanbanMeetingSchema(db:Client){
 await ensureKanbanPeriodTables(db);
 await assertKanbanSchema(db,"smn_kanban_meeting");
}
export async function listKanbanCalendarMeetings(db:Client,start:string,end:string){
 await ensureKanbanMeetingSchema(db);
 const r=await db.query<{id:string;name:string;start_at:string;end_at:string;status:string;provenance:string}>(`
 SELECT m.id,m.name,m.starts_at::text AS start_at,m.ends_at::text AS end_at,m.status,m.provenance
 FROM public.smn_kanban_meeting m JOIN public.smn_kanban_period p ON p.id=m.period_id
 JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban' AND p.deleted_at IS NULL
 AND m.starts_at<($2::date+interval '1 day') AND m.ends_at>=$1::date
 ORDER BY m.starts_at,m.id LIMIT 500`,[start,end]);
 return r.rows.map(m=>({id:m.id,name:m.name,startAt:m.start_at,endAt:m.end_at,status:m.status,
  kind:"kanban",generationSource:m.provenance,href:"/app/team-calendar"}));
}
export async function createKanbanMeeting(db:Client,actorId:string,raw:unknown){
 const x=parseKanbanMeeting(raw);if(!x)return {ok:false as const,error:"invalid-input"};
 await ensureKanbanMeetingSchema(db);
 await db.query("BEGIN");
 try{
  const r=await db.query<{status:string}>(`SELECT p.status FROM public.smn_kanban_period p
  JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'
  FOR UPDATE OF p`,[x.periodId]);
  if(!r.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(r.rows[0].status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period"};}
  const end=new Date(Date.parse(x.startAt)+x.duration*60000).toISOString();
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_kanban_meeting(id,period_id,name,starts_at,ends_at,created_by)
  VALUES($1,$2,$3,$4,$5,$6)`,[id,x.periodId,x.name,x.startAt,end,actorId]);
  await db.query("COMMIT");return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}

/** Lecture Kanban multiéquipes : ne crée aucune table à la consultation.
 * teamId est préalablement résolu côté serveur pour le compte autorisé.
 */
export async function listScopedKanbanCalendarMeetings(db:Client,
 start:string,end:string,teamId:string){
 const exists=await db.query<{present:boolean}>(
  "SELECT to_regclass('public.smn_kanban_meeting') IS NOT NULL AS present");
 if(!exists.rows[0]?.present)return [];
 const result=await db.query<{id:string;name:string;start_at:string;end_at:string;status:string;provenance:string}>(`
 SELECT m.id,m.name,m.starts_at::text AS start_at,m.ends_at::text AS end_at,
 m.status,m.provenance
 FROM public.smn_kanban_meeting m
 JOIN public.smn_kanban_period p ON p.id=m.period_id
 JOIN public.smn_team t ON t.id=p.team_id
 WHERE p.team_id=$3 AND t.installation_id='singleton'
   AND p.deleted_at IS NULL
   AND m.starts_at<($2::date+interval '1 day') AND m.ends_at>=$1::date
 ORDER BY m.starts_at,m.id LIMIT 500`,[start,end,teamId]);
 return result.rows.map(m=>({
  id:m.id,name:m.name,startAt:m.start_at,endAt:m.end_at,status:m.status,
  kind:"kanban",generationSource:m.provenance,href:"/app/team-calendar"
 }));
}
