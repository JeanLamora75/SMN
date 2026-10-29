import {randomUUID} from "node:crypto";
import type {Client} from "pg";
const id=/^[a-f0-9-]{36}$/i;
/** Réalisé documenté, sans déduction de la capacité initiale. */
export type HistoricalActualCapacityInput={sprintId:string;quality:"known"|"estimated"|"not-supplied";qualifiedJh:number|null;source:string;reason:string;revision:number};
export function parseHistoricalActualCapacity(raw:unknown):HistoricalActualCapacityInput|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="qualifiedJh,quality,reason,revision,source,sprintId"||
 typeof v.sprintId!=="string"||!id.test(v.sprintId)||
 !["known","estimated","not-supplied"].includes(String(v.quality))||
 typeof v.source!=="string"||v.source.length>500||
 typeof v.reason!=="string"||v.reason.length>1000||
 !Number.isSafeInteger(v.revision)||Number(v.revision)<0)return null;
 const q=v.quality as HistoricalActualCapacityInput["quality"];
 if(q==="not-supplied"&&v.qualifiedJh!==null)return null;
 if(q!=="not-supplied"&&(typeof v.qualifiedJh!=="number"||!Number.isFinite(v.qualifiedJh)||
 v.qualifiedJh<0||v.qualifiedJh>99999999.9999||Math.abs(v.qualifiedJh*10000-Math.round(v.qualifiedJh*10000))>1e-6))return null;
 return {sprintId:v.sprintId,quality:q,qualifiedJh:q==="not-supplied"?null:v.qualifiedJh as number,
 source:v.source.trim(),reason:v.reason.trim(),revision:v.revision as number};
}
export async function writeHistoricalActualCapacity(db:Client,actorId:string,raw:unknown){
 const x=parseHistoricalActualCapacity(raw);
 if(!actorId||!x)return {ok:false as const,error:"invalid-input"};
 await db.query("SELECT to_regclass('public.smn_sprint_historical_actual_capacity') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
 await db.query("SELECT to_regclass('public.smn_sprint_historical_actual_capacity_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("sprint-schema-not-ready: apply-sprint-aggregates-v32")});
 await db.query("BEGIN");
 try{
  const sprint=await db.query<{status:string}>(`
 SELECT s.status FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode)='scrum' AND EXISTS(
 SELECT 1 FROM public.smn_sprint_audit a WHERE a.sprint_id=s.id AND a.action='historical-created')
 FOR UPDATE OF s`,[x.sprintId]);
  if(!sprint.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-historical"};}
  if(sprint.rows[0].status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period"};}
  const old=await db.query<{quality:string;qualified_jh:string|null;source_ref:string|null;reason:string|null;revision:number}>(`
 SELECT quality,qualified_jh::text,source_ref,reason,revision FROM public.smn_sprint_historical_actual_capacity
 WHERE sprint_id=$1 FOR UPDATE`,[x.sprintId]);
  const previous=old.rows[0];
  if((previous?.revision??0)!==x.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
  const next=x.revision+1;
  await db.query(`INSERT INTO public.smn_sprint_historical_actual_capacity
 (sprint_id,quality,qualified_jh,source_ref,reason,revision,updated_by)
 VALUES($1,$2,$3,$4,$5,$6,$7)
 ON CONFLICT(sprint_id) DO UPDATE SET quality=excluded.quality,qualified_jh=excluded.qualified_jh,
 source_ref=excluded.source_ref,reason=excluded.reason,revision=excluded.revision,
 updated_by=excluded.updated_by,updated_at=now()`,[x.sprintId,x.quality,x.qualifiedJh,x.source||null,x.reason||null,next,actorId]);
  await db.query(`INSERT INTO public.smn_sprint_historical_actual_capacity_audit
 (id,sprint_id,before_values,after_values,actor_id) VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,
 [randomUUID(),x.sprintId,previous?JSON.stringify(previous):null,JSON.stringify(x),actorId]);
  await db.query("COMMIT");return {ok:true as const,revision:next};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
