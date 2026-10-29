import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureAttendanceSchema} from "./attendance";
type Kind="standard"|"custom"|"exceptional";
const table:Record<Kind,{name:string;planned:string}>={standard:{name:"smn_sprint_ceremony",planned:"minutes"},custom:{name:"smn_scrum_template_occurrence",planned:"EXTRACT(EPOCH FROM (ends_at-starts_at))/60"},exceptional:{name:"smn_sprint_exceptional_meeting",planned:"duration_minutes"}};
export async function ensureActualDurationSchema(db:Client){
 const names=["smn_meeting_actual_duration_audit"] as const;
 const found=await db.query<{present:string[]}>(`SELECT array_agg(relname)::text[] AS present FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY($1::text[])`,[names]);
 if(names.some(name=>!found.rows[0]?.present?.includes(name)))throw Error("ceremony-schema-not-ready: apply-ceremony-schema-v32");
}
async function team(db:Client){
 const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(r.rows.length!==1)throw Error("scrum-team-unavailable");return r.rows[0].id;
}
export async function listActualDurations(db:Client){
 await ensureActualDurationSchema(db);const teamId=await team(db),rows=[];
 for(const kind of Object.keys(table) as Kind[]){
  const x=table[kind];
  const result=await db.query(`SELECT m.id,s.name AS "sprintName",s.status AS "sprintStatus",
   m.starts_at::text AS "startAt",m.ends_at::text AS "endAt",
   round((${x.planned})::numeric)::integer AS "plannedMinutes",
   COALESCE(m.actual_minutes,round((${x.planned})::numeric)::integer) AS "actualMinutes",
   m.actual_minutes IS NOT NULL AS "customized"
   FROM public.${x.name} m JOIN public.smn_sprint s ON s.id=m.sprint_id
   WHERE s.team_id=$1 AND s.deleted_at IS NULL ORDER BY m.starts_at DESC LIMIT 200`,[teamId]);
  rows.push(...result.rows.map(r=>({...r,kind,deltaMinutes:r.actualMinutes-r.plannedMinutes})));
 }
 return rows.sort((a,b)=>String(b.startAt).localeCompare(String(a.startAt)));
}
export async function updateActualDuration(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).sort().join(",")!=="id,kind,minutes"||
 !["standard","custom","exceptional"].includes(String(o.kind))||typeof o.id!=="string"||
 !/^[a-f\d-]{36}$/i.test(o.id)||!Number.isSafeInteger(o.minutes)||Number(o.minutes)<0||Number(o.minutes)>1440)
 return {ok:false as const,error:"invalid-input" as const};
 const kind=o.kind as Kind,x=table[kind];await ensureActualDurationSchema(db);const teamId=await team(db);
 await db.query("BEGIN");
 try{
  const found=await db.query<{status:string;planned_minutes:number;actual_minutes:number|null}>(`SELECT s.status,round((${x.planned})::numeric)::integer AS planned_minutes,m.actual_minutes
   FROM public.${x.name} m JOIN public.smn_sprint s ON s.id=m.sprint_id
   WHERE m.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL FOR UPDATE OF m,s`,[o.id,teamId]);
  const prior=found.rows[0];
  if(!prior){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(prior.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};}
  const current=prior.actual_minutes??prior.planned_minutes;
  if(current!==o.minutes){
   await db.query(`UPDATE public.${x.name} SET actual_minutes=$2 WHERE id=$1`,[o.id,o.minutes]);
   await db.query(`INSERT INTO public.smn_meeting_actual_duration_audit
   (id,kind,event_id,previous_minutes,new_minutes,planned_minutes,actor_id) VALUES($1,$2,$3,$4,$5,$6,$7)`,
   [randomUUID(),kind,o.id,prior.actual_minutes,o.minutes,prior.planned_minutes,actorId]);
  }
  await db.query("COMMIT");
  return {ok:true as const,plannedMinutes:prior.planned_minutes,actualMinutes:o.minutes,deltaMinutes:Number(o.minutes)-prior.planned_minutes};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
