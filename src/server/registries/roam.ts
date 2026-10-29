import {randomUUID} from "node:crypto";
import {riskCriticalEvent} from "./confirmed-highlights";
import type {Client} from "pg";
import {roamValues,type Roam} from "@/lib/roam-values";
export function parseRoam(value:unknown):Roam|null{
 return typeof value==="string"&&roamValues.some(x=>x===value)?value as Roam:null;
}
export function shouldAlertHighRisk(roam:Roam|null,probability:number|null,impact:number|null):boolean{
 return roam!=="resolved"&&probability!==null&&impact!==null&&probability*impact>=6;
}
export async function ensureRoamSchema(db:Client){
 await db.query("SELECT to_regclass('public.smn_risk_roam') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-core-v32")});
 await db.query("SELECT to_regclass('public.smn_risk_roam_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-core-v32")});
}
/** Separate ROAM aggregate: this write never touches risk probability, impact or status. */
export async function updateRiskRoam(db:Client,actorId:string,id:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>,classification=parseRoam(v.classification);
 if(Object.keys(v).sort().join(",")!=="classification,revision"||!classification||
  !Number.isSafeInteger(v.revision)||Number(v.revision)<0||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||!actorId)
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const item=await db.query<{id:string}>(`SELECT r.id FROM public.smn_registry_item r
   JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND r.type='risk' AND i.id='singleton' AND i.state='initialized'
   FOR UPDATE OF r`,[id]);
  if(item.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await ensureRoamSchema(db);
  const previous=await db.query<{classification:Roam;revision:number}>(`
   SELECT classification,revision FROM public.smn_risk_roam WHERE item_id=$1 FOR UPDATE`,[id]);
  const old=previous.rows[0];
  if((old?.revision??0)!==v.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  const next=(old?.revision??0)+1;
  if(old)await db.query(`UPDATE public.smn_risk_roam
    SET classification=$2,revision=$3,updated_by=$4,updated_at=now() WHERE item_id=$1`,
    [id,classification,next,actorId]);
  else await db.query(`INSERT INTO public.smn_risk_roam(item_id,classification,revision,updated_by)
    VALUES($1,$2,1,$3)`,[id,classification,actorId]);
  await db.query(`INSERT INTO public.smn_risk_roam_audit
   (id,item_id,revision,previous_classification,next_classification,actor_id)
   VALUES($1,$2,$3,$4,$5,$6)`,
   [randomUUID(),id,next,old?.classification??null,classification,actorId]);
  if(classification!=="resolved"&&old?.classification==="resolved")await riskCriticalEvent(db,id,actorId,next);
  await db.query("COMMIT");
  return {ok:true as const,id,revision:next,classification};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function readRiskRoam(db:Client,id:string){
 if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 const result=await db.query<{classification:Roam|null;revision:number|null;updatedAt:string|null}>(`
  SELECT x.classification,x.revision,x.updated_at::text AS "updatedAt"
  FROM public.smn_registry_item r JOIN public.smn_team t ON t.id=r.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  LEFT JOIN public.smn_risk_roam x ON x.item_id=r.id
  WHERE r.id=$1 AND r.type='risk' AND i.id='singleton' AND i.state='initialized'`,[id]);
 const row=result.rows[0];return row?{classification:row.classification,revision:row.revision??0,updatedAt:row.updatedAt}:null;
}
