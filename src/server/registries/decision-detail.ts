import {randomUUID} from "node:crypto";
import type {Client} from "pg";
export async function ensureDecisionDetail(db:Client){
 await db.query("SELECT to_regclass('public.smn_decision_detail') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
 await db.query("SELECT to_regclass('public.smn_decision_detail_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
}
export async function readDecisionDetail(db:Client,id:string){
 if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 const base=await db.query(`SELECT r.id,r.team_id FROM public.smn_registry_item r
  JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE r.id=$1 AND r.type='decision' AND i.id='singleton' AND i.state='initialized'`,[id]);
 if(!base.rows.length)return null;
 const has=await db.query<{installed:boolean}>(`SELECT to_regclass('public.smn_decision_detail') IS NOT NULL AS installed`);
 if(!has.rows[0]?.installed)return {rationale:null,replacesId:null,revision:0,replacedBy:[]};
 const d=await db.query<{rationale:string|null;replacesId:string|null;revision:number}>(`
  SELECT rationale,replaces_id AS "replacesId",revision FROM public.smn_decision_detail WHERE item_id=$1`,[id]);
 const inverse=await db.query<{id:string;title:string}>(`
  SELECT r.id,r.title FROM public.smn_decision_detail x JOIN public.smn_registry_item r ON r.id=x.item_id
  WHERE x.replaces_id=$1 AND r.team_id=(SELECT team_id FROM public.smn_registry_item WHERE id=$1)
  ORDER BY r.created_at,r.id`,[id]);
 return {rationale:d.rows[0]?.rationale??null,replacesId:d.rows[0]?.replacesId??null,revision:d.rows[0]?.revision??0,replacedBy:inverse.rows};
}
export async function saveDecisionDetail(db:Client,actorId:string,id:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||!actorId)return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="rationale,replacesId,revision"||
  !(v.rationale===null||(typeof v.rationale==="string"&&v.rationale.length<=4000))||
  !(v.replacesId===null||(typeof v.replacesId==="string"&&/^[0-9a-f-]{36}$/i.test(v.replacesId)))||
  !Number.isSafeInteger(v.revision)||Number(v.revision)<0||!/^[0-9a-f-]{36}$/i.test(id)||
  v.replacesId===id)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const src=await db.query<{team_id:string;status:string}>(`SELECT r.team_id,r.status FROM public.smn_registry_item r
    JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE r.id=$1 AND r.type='decision' AND i.id='singleton' AND i.state='initialized' FOR UPDATE OF r`,[id]);
  if(src.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(v.replacesId!==null){
   const target=await db.query(`SELECT 1 FROM public.smn_registry_item r
    WHERE r.id=$1 AND r.team_id=$2 AND r.type='decision' AND r.id<>$3`,[v.replacesId,src.rows[0].team_id,id]);
   if(target.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-target" as const};}
  }
  await ensureDecisionDetail(db);
  const previous=await db.query<{rationale:string|null;replaces_id:string|null;revision:number}>(`
   SELECT rationale,replaces_id,revision FROM public.smn_decision_detail WHERE item_id=$1 FOR UPDATE`,[id]);
  const old=previous.rows[0];
  if((old?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  if(v.replacesId!==null){
   const chain=await db.query<{id:string}>(`WITH RECURSIVE parents(id) AS(
    SELECT $1::text UNION ALL SELECT x.replaces_id FROM public.smn_decision_detail x
    JOIN parents p ON x.item_id=p.id WHERE x.replaces_id IS NOT NULL)
    SELECT id FROM parents WHERE id=$2 LIMIT 1`,[v.replacesId,id]);
   if(chain.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"cycle" as const};}
  }
  const revision=(old?.revision??0)+1;
  if(old)await db.query(`UPDATE public.smn_decision_detail SET rationale=$2,replaces_id=$3,
   revision=$4,updated_at=now(),updated_by=$5 WHERE item_id=$1`,
   [id,v.rationale,v.replacesId,revision,actorId]);
  else await db.query(`INSERT INTO public.smn_decision_detail(item_id,rationale,replaces_id,revision,updated_by)
   VALUES($1,$2,$3,1,$4)`,[id,v.rationale,v.replacesId,actorId]);
  await db.query(`INSERT INTO public.smn_decision_detail_audit(id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,[randomUUID(),id,revision,old?JSON.stringify(old):null,JSON.stringify({rationale:v.rationale,replacesId:v.replacesId}),actorId]);
  await db.query("COMMIT");return {ok:true as const,revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
