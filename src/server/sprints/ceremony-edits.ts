import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {ensureCeremonySchema} from "./ceremonies";

export async function ensureCeremonyEditSchema(db:Client){
 await ensureCeremonySchema(db);
 await db.query("ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS provenance text NOT NULL DEFAULT 'generated'");
 await db.query("ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS occurrence_status text NOT NULL DEFAULT 'scheduled'");
 await db.query("ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1");
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony_history(
  id text PRIMARY KEY,ceremony_id text NOT NULL REFERENCES public.smn_sprint_ceremony(id) ON DELETE RESTRICT,
  revision integer NOT NULL,previous_values jsonb NOT NULL,next_values jsonb NOT NULL,
  changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(ceremony_id,revision))`);
}
export async function listEditableCeremonies(db:Client){
 await ensureCeremonyEditSchema(db);
 const r=await db.query(`SELECT c.id,c.kind,c.starts_at::text AS "startAt",c.ends_at::text AS "endAt",
  c.minutes,c.revision,c.occurrence_status AS status,c.provenance,c.generation_source AS "generationSource",s.name AS "sprintName"
  FROM public.smn_sprint_ceremony c JOIN public.smn_sprint s ON s.id=c.sprint_id
  JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE i.id='singleton' AND lower(i.mode)='scrum' AND s.deleted_at IS NULL
  ORDER BY c.starts_at DESC LIMIT 300`);
 return r.rows;
}
export async function editCeremony(db:Client,actorId:string,id:string,raw:unknown){
 if(!/^[a-f0-9-]{36}$/i.test(id)||!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const o=raw as Record<string,unknown>,keys=Object.keys(o);
 if(keys.length!==4||keys.some(k=>!["startAt","minutes","scope","revision"].includes(k))||
 typeof o.startAt!=="string"||!Number.isFinite(Date.parse(o.startAt))||
 !Number.isSafeInteger(o.minutes)||Number(o.minutes)<1||Number(o.minutes)>600||
 !Number.isSafeInteger(o.revision)||Number(o.revision)<1||
 !["single","following"].includes(String(o.scope)))return {ok:false as const,error:"invalid-input" as const};
 await assertLegacyTeamApi(db);
 await ensureCeremonyEditSchema(db);
 await db.query("BEGIN");
 try{
  const row=await db.query<{id:string;sprint_id:string;kind:string;starts_at:string;ends_at:string;minutes:number;revision:number;occurrence_status:string;sprint_status:string}>(`SELECT s.status AS sprint_status,c.id,c.sprint_id,c.kind,c.starts_at::text,c.ends_at::text,c.minutes,c.revision,c.occurrence_status
  FROM public.smn_sprint_ceremony c JOIN public.smn_sprint s ON s.id=c.sprint_id JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE c.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND lower(i.mode)='scrum' FOR UPDATE OF c,s`,[id]);
  const initial=row.rows[0];
  if(!initial){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(initial.sprint_status==='closed'){await db.query('ROLLBACK');return {ok:false as const,error:'protected' as const};}
  if(initial.revision!==o.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  if(initial.occurrence_status!=="scheduled"){await db.query("ROLLBACK");return {ok:false as const,error:"protected" as const};}
  if(o.scope==="following"&&initial.kind!=="daily"){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input" as const};}
  const candidates=o.scope==="single"?[initial]: (await db.query<typeof initial>(`SELECT id,sprint_id,kind,starts_at::text,ends_at::text,minutes,revision,occurrence_status FROM public.smn_sprint_ceremony
  WHERE sprint_id=$1 AND kind='daily' AND starts_at >= $2 AND starts_at > now() AND occurrence_status='scheduled' ORDER BY starts_at FOR UPDATE`,[initial.sprint_id,initial.starts_at])).rows;
  const shift=Date.parse(String(o.startAt))-Date.parse(initial.starts_at);
  const changed=[];
  let warningCount=0;
  for(const item of candidates){
   const start=new Date(Date.parse(item.starts_at)+shift),end=new Date(start.getTime()+Number(o.minutes)*60000);
   if(!Number.isFinite(start.valueOf())||!Number.isFinite(end.valueOf()))throw Error("invalid-time");
   const overlap=await db.query<{count:string}>(`SELECT COUNT(DISTINCT c.id)::text AS count FROM public.smn_sprint_ceremony c
    JOIN public.smn_sprint s ON s.id=c.sprint_id
    JOIN public.smn_sprint target ON target.id=$1
    WHERE s.team_id=target.team_id AND c.id<>$2 AND s.deleted_at IS NULL AND c.starts_at<$4 AND c.ends_at>$3`,[item.sprint_id,item.id,start.toISOString(),end.toISOString()]);
   warningCount+=Number(overlap.rows[0]?.count??0);
   const before={startAt:item.starts_at,endAt:item.ends_at,minutes:item.minutes,status:item.occurrence_status};
   const next={startAt:start.toISOString(),endAt:end.toISOString(),minutes:o.minutes,status:item.occurrence_status};
   await db.query(`UPDATE public.smn_sprint_ceremony SET starts_at=$2,ends_at=$3,minutes=$4,provenance='customized',revision=revision+1 WHERE id=$1`,[item.id,next.startAt,next.endAt,next.minutes]);
   await db.query("DELETE FROM public.smn_sprint_ceremony_segment WHERE ceremony_id=$1",[item.id]);
   await db.query(`INSERT INTO public.smn_sprint_ceremony_segment(ceremony_id,position,starts_at,ends_at,minutes) VALUES($1,1,$2,$3,$4)`,[item.id,next.startAt,next.endAt,next.minutes]);
   await db.query(`INSERT INTO public.smn_sprint_ceremony_history(id,ceremony_id,revision,previous_values,next_values,changed_by)
    VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,[randomUUID(),item.id,item.revision+1,JSON.stringify(before),JSON.stringify(next),actorId]);
   changed.push(item.id);
  }
  await db.query("COMMIT");
  return {ok:true as const,changed,warningCount};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function ceremonyHistory(db:Client,id:string){
 await ensureCeremonyEditSchema(db);
 const result=await db.query(`SELECT h.revision,h.previous_values AS "previous",h.next_values AS "next",h.changed_by AS "changedBy",h.changed_at::text AS "changedAt"
 FROM public.smn_sprint_ceremony_history h JOIN public.smn_sprint_ceremony c ON c.id=h.ceremony_id
 JOIN public.smn_sprint s ON s.id=c.sprint_id JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE h.ceremony_id=$1 AND i.id='singleton' AND lower(i.mode)='scrum' ORDER BY revision DESC`,[id]);
 return result.rows;
}
