import type {Client} from "pg";
import {randomUUID} from "node:crypto";
import {recordConfirmedHighlight} from "./confirmed-highlights";
export const dependencyStates=["open","in_progress","satisfied","cancelled"] as const;
export type DependencyState=typeof dependencyStates[number];
export function dependencyActive(status:string){return status==="open"||status==="in_progress";}
export function dependencyLate(status:string,dueOn:string|null,today:string){return dependencyActive(status)&&dueOn!==null&&dueOn<today;}
export async function ensureDependencyFlag(db:Client){
 await db.query("SELECT to_regclass('public.smn_dependency_vigilance') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
 await db.query("SELECT to_regclass('public.smn_dependency_vigilance_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
}
export async function readDependencyFlag(db:Client,id:string){
 const scope=await db.query(`SELECT r.id FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND r.type='dependency' AND i.id='singleton' AND i.state='initialized'`,[id]);
 if(!scope.rows.length)return null;
 const installed=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_dependency_vigilance') IS NOT NULL AS present`);
 if(!installed.rows[0]?.present)return {atRisk:false,revision:0};
 const result=await db.query<{atRisk:boolean;revision:number}>(`SELECT at_risk AS "atRisk",revision FROM public.smn_dependency_vigilance WHERE item_id=$1`,[id]);
 return result.rows[0]??{atRisk:false,revision:0};
}
export async function writeDependencyFlag(db:Client,actorId:string,id:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="atRisk,revision"||typeof v.atRisk!=="boolean"||
 !Number.isSafeInteger(v.revision)||Number(v.revision)<0||!/^[a-f0-9-]{36}$/i.test(id)||!actorId)
 return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const scope=await db.query(`SELECT r.id FROM public.smn_registry_item r JOIN public.smn_team t ON t.id=r.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND r.type='dependency' AND i.id='singleton' AND i.state='initialized' FOR UPDATE OF r`,[id]);
  if(!scope.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await ensureDependencyFlag(db);
  const found=await db.query<{atRisk:boolean;revision:number}>(`SELECT at_risk AS "atRisk",revision
   FROM public.smn_dependency_vigilance WHERE item_id=$1 FOR UPDATE`,[id]);
  const old=found.rows[0];
  if((old?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  const revision=(old?.revision??0)+1;
  if(old)await db.query(`UPDATE public.smn_dependency_vigilance SET at_risk=$2,revision=$3,updated_at=now(),updated_by=$4 WHERE item_id=$1`,
   [id,v.atRisk,revision,actorId]);
  else await db.query(`INSERT INTO public.smn_dependency_vigilance(item_id,at_risk,revision,updated_by) VALUES($1,$2,1,$3)`,[id,v.atRisk,actorId]);
  await db.query(`INSERT INTO public.smn_dependency_vigilance_audit(id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,[randomUUID(),id,revision,old?JSON.stringify(old):null,JSON.stringify({atRisk:v.atRisk}),actorId]);
  if(v.atRisk&&old?.atRisk!==true){const title=await db.query<{title:string}>(`SELECT title FROM public.smn_registry_item WHERE id=$1`,[id]);await recordConfirmedHighlight(db,{category:"atRiskDependency",sourceKind:"registry",sourceId:id,sourceRevision:revision,title:title.rows[0]?.title??id,actorId});}
  await db.query("COMMIT");return {ok:true as const,atRisk:v.atRisk,revision};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
