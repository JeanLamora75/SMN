import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureExceptionalMeetingSchema} from "./exceptional-meetings";
import {ensureCeremonyEditSchema} from "./ceremony-edits";
import {ensureTemplateOccurrenceSchema} from "./template-occurrences";

type Kind="standard"|"custom"|"exceptional";
type State="scheduled"|"held"|"not_held"|"cancelled";
const tables:Record<Kind,{table:string;history:string;key:string}>={standard:{table:"smn_sprint_ceremony",history:"smn_sprint_ceremony_status_history",key:"ceremony_id"},custom:{table:"smn_scrum_template_occurrence",history:"smn_scrum_template_occurrence_status_history",key:"occurrence_id"},exceptional:{table:"smn_sprint_exceptional_meeting",history:"smn_sprint_exceptional_meeting_status_history",key:"meeting_id"}};
export async function ensureAttendanceSchema(db:Client){
 const names=["smn_sprint_ceremony_status_history","smn_scrum_template_occurrence_status_history","smn_sprint_exceptional_meeting_status_history"] as const;
 const found=await db.query<{present:string[]}>(`SELECT array_agg(relname)::text[] AS present FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])`,[names]);
 if(names.some(name=>!found.rows[0]?.present?.includes(name)))throw Error("ceremony-schema-not-ready: apply-ceremony-schema-v32");
}
const column=(kind:Kind)=>kind==="standard"?"occurrence_status":"status";
async function team(db:Client){const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);if(r.rows.length!==1)throw Error("scrum-team-unavailable");return r.rows[0].id;}
export async function reconcileAttendance(db:Client){
 await ensureAttendanceSchema(db);const teamId=await team(db);
 const stats:Record<string,number>={};
 for(const kind of ["standard","custom","exceptional"] as Kind[]){
  const t=tables[kind],status=column(kind);
  const r=await db.query(`UPDATE public.${t.table} m SET ${status}='held'
   FROM public.smn_sprint s WHERE s.id=m.sprint_id AND s.team_id=$1 AND s.deleted_at IS NULL
   AND s.status<>'closed' AND m.ends_at<=now() AND m.${status}='scheduled' AND m.status_explicit=false
   AND COALESCE(m.generation_source,'standard') NOT IN ('reconstructed','historical-documented')`,[teamId]);
  stats[kind]=r.rowCount??0;
 }
 return stats;
}
export async function listAttendance(db:Client){
 await reconcileAttendance(db);const teamId=await team(db);
 const items=[];
 for(const kind of ["standard","custom","exceptional"] as Kind[]){
  const t=tables[kind],status=column(kind);
  const r=await db.query(`SELECT m.id,m.sprint_id AS "sprintId",s.name AS "sprintName",
  m.starts_at::text AS "startAt",m.ends_at::text AS "endAt",m.${status} AS status,m.status_explicit AS explicit
  FROM public.${t.table} m JOIN public.smn_sprint s ON s.id=m.sprint_id
  WHERE s.team_id=$1 AND s.deleted_at IS NULL ORDER BY m.starts_at DESC LIMIT 200`,[teamId]);
  items.push(...r.rows.map(x=>({...x,kind})));
 }
 return items.sort((a,b)=>String(b.startAt).localeCompare(String(a.startAt)));
}
export async function qualifyAttendance(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).some(k=>!["kind","id","status","reason"].includes(k))||
 !["standard","custom","exceptional"].includes(String(o.kind))||
 typeof o.id!=="string"||!/^[a-f0-9-]{36}$/i.test(o.id)||
 !["held","not_held","cancelled"].includes(String(o.status))||
 o.reason!==undefined&&(typeof o.reason!=="string"||o.reason.length>1000))return {ok:false as const,error:"invalid-input" as const};
 const kind=o.kind as Kind,target=o.status as State,t=tables[kind],status=column(kind);
 await ensureAttendanceSchema(db);const teamId=await team(db);
 await db.query("BEGIN");
 try{
  const found=await db.query<{id:string;status:string;ends_at:string;sprint_status:string}>(`SELECT m.id,m.${status} AS status,m.ends_at::text,s.status AS sprint_status FROM public.${t.table} m
  JOIN public.smn_sprint s ON s.id=m.sprint_id WHERE m.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL FOR UPDATE OF m,s`,[o.id,teamId]);
  const old=found.rows[0];
  if(!old){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(old.sprint_status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  if(target==="not_held"&&new Date(old.ends_at)>new Date()){await db.query("ROLLBACK");return {ok:false as const,error:"not-yet-due" as const};}
  if(target==="held"&&new Date(old.ends_at)>new Date()){await db.query("ROLLBACK");return {ok:false as const,error:"not-yet-due" as const};}
  if(old.status!==target){
   await db.query(`UPDATE public.${t.table} SET ${status}=$2,status_explicit=true WHERE id=$1`,[o.id,target]);
   await db.query(`INSERT INTO public.${t.history}(id,${t.key},previous_status,next_status,reason,actor_id) VALUES($1,$2,$3,$4,$5,$6)`,
   [randomUUID(),o.id,old.status,target,typeof o.reason==="string"?o.reason.trim()||null:null,actorId]);
  }
  await db.query("COMMIT");return {ok:true as const,status:target,changed:old.status!==target};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function attendanceHistory(db:Client,kind:Kind,id:string){
 await ensureAttendanceSchema(db);const teamId=await team(db);const t=tables[kind];
 const r=await db.query(`SELECT h.previous_status AS "previous",h.next_status AS "next",h.reason,h.actor_id AS "actorId",h.changed_at::text AS "changedAt"
 FROM public.${t.history} h JOIN public.${t.table} m ON m.id=h.${t.key}
 JOIN public.smn_sprint s ON s.id=m.sprint_id WHERE h.${t.key}=$1 AND s.team_id=$2 ORDER BY h.changed_at DESC`,[id,teamId]);return r.rows;
}
