import type {Client} from "pg";
import {deadlineState} from "@/lib/registry-deadlines";
export async function readDeadlineSettings(db:Client){
 const found=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_registry_deadline_settings') IS NOT NULL AS present`);
 if(!found.rows[0]?.present)return {days:3,revision:0};
 const r=await db.query<{days:number;revision:number}>(`SELECT days,revision FROM public.smn_registry_deadline_settings WHERE id='singleton'`);
 return r.rows[0]??{days:3,revision:0};
}
export async function updateDeadlineSettings(db:Client,actorId:string,value:unknown){
 if(!value||typeof value!=="object"||Array.isArray(value))return {ok:false as const,error:"invalid-input" as const};
 const v=value as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="days,revision"||!Number.isInteger(v.days)||Number(v.days)<0||Number(v.days)>365||
 !Number.isInteger(v.revision)||Number(v.revision)<0||!actorId)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  await db.query("SELECT to_regclass('public.smn_registry_deadline_settings') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
  const previous=await db.query<{days:number;revision:number}>(`SELECT days,revision FROM public.smn_registry_deadline_settings WHERE id='singleton' FOR UPDATE`);
  const old=previous.rows[0],revision=(old?.revision??0)+1;
  if((old?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  if(old)await db.query(`UPDATE public.smn_registry_deadline_settings SET days=$1,revision=$2,updated_at=now(),updated_by=$3 WHERE id='singleton'`,[v.days,revision,actorId]);
  else await db.query(`INSERT INTO public.smn_registry_deadline_settings(id,days,revision,updated_by) VALUES('singleton',$1,1,$2)`,[v.days,actorId]);
  await db.query("COMMIT");return {ok:true as const,days:v.days,revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function readDeadlineAlerts(db:Client,today:string,teamId?:string){
 const settings=await readDeadlineSettings(db);
 const available=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS present`);
 if(!available.rows[0]?.present)return {days:settings.days,revision:settings.revision,alerts:[]};
 const r=await db.query<{id:string;title:string;type:string;status:string;dueOn:string|null}>(`
 SELECT r.id,r.title,r.type,r.status,r.due_on::text AS "dueOn" FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE i.id='singleton' AND i.state='initialized' AND r.type IN ('action','dependency')
 AND r.due_on IS NOT NULL AND r.status IN ('todo','in_progress','open')\n AND ($1::text IS NULL OR r.team_id=$1)
 ORDER BY r.due_on,r.id`,[teamId??null]);
 return {days:settings.days,revision:settings.revision,alerts:r.rows.flatMap(x=>{const state=deadlineState(x.type,x.status,x.dueOn,today,settings.days);
 return state?[{...x,state}]:[];})};
}
