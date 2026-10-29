import {randomUUID} from "node:crypto";
import type {Client} from "pg";
export type Party={kind:"local";teamId:string}|{kind:"external";name:string};
export function parseParty(v:unknown,localId:string):Party|null{
 if(!v||typeof v!=="object"||Array.isArray(v))return null;
 const p=v as Record<string,unknown>;
 if(p.kind==="local"&&Object.keys(p).sort().join(",")==="kind,teamId"&&p.teamId===localId)return {kind:"local",teamId:localId};
 if(p.kind==="external"&&Object.keys(p).sort().join(",")==="kind,name"&&typeof p.name==="string"&&p.name.trim().length>0&&p.name.trim().length<=120)
  return {kind:"external",name:p.name.trim()};
 return null;
}
export async function ensureParties(db:Client){
 await db.query("SELECT to_regclass('public.smn_dependency_parties') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
 await db.query("SELECT to_regclass('public.smn_dependency_parties_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
}
export async function writeParties(db:Client,actorId:string,id:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw)||!/^[a-f0-9-]{36}$/i.test(id))return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="contributor,requester,revision"||!Number.isSafeInteger(v.revision)||Number(v.revision)<0)
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const scope=await db.query<{id:string;team_id:string}>(`SELECT r.id,r.team_id FROM public.smn_registry_item r
   JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND r.type='dependency' AND i.id='singleton' AND i.state='initialized' FOR UPDATE OF r`,[id]);
  const localId=scope.rows[0]?.team_id;
  if(!localId){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  const requester=parseParty(v.requester,localId),contributor=parseParty(v.contributor,localId);
  if(!requester||!contributor){await db.query("ROLLBACK");return {ok:false as const,error:"invalid-input" as const};}
  await ensureParties(db);
  const previous=await db.query<{requester:Party;contributor:Party;revision:number}>(`
   SELECT requester,contributor,revision FROM public.smn_dependency_parties WHERE item_id=$1 FOR UPDATE`,[id]);
  const old=previous.rows[0];
  if((old?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  const revision=(old?.revision??0)+1;
  if(old)await db.query(`UPDATE public.smn_dependency_parties
   SET requester=$2::jsonb,contributor=$3::jsonb,revision=$4,updated_at=now(),updated_by=$5 WHERE item_id=$1`,
   [id,JSON.stringify(requester),JSON.stringify(contributor),revision,actorId]);
  else await db.query(`INSERT INTO public.smn_dependency_parties(item_id,requester,contributor,revision,updated_by)
   VALUES($1,$2::jsonb,$3::jsonb,1,$4)`,[id,JSON.stringify(requester),JSON.stringify(contributor),actorId]);
  await db.query(`INSERT INTO public.smn_dependency_parties_audit(id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,[randomUUID(),id,revision,old?JSON.stringify(old):null,JSON.stringify({requester,contributor}),actorId]);
  await db.query("COMMIT");return {ok:true as const,id,revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function readParties(db:Client,id:string){
 if(!/^[a-f0-9-]{36}$/i.test(id))return null;
 const scope=await db.query<{teamId:string;teamName:string}>(`SELECT r.team_id AS "teamId",t.name AS "teamName" FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND r.type='dependency' AND i.id='singleton' AND i.state='initialized'`,[id]);
 if(!scope.rows[0])return null;
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_dependency_parties') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return {...scope.rows[0],requester:null,contributor:null,revision:0};
 const result=await db.query<{requester:Party;contributor:Party;revision:number}>(`
  SELECT requester,contributor,revision FROM public.smn_dependency_parties WHERE item_id=$1`,[id]);
 return {...scope.rows[0],requester:result.rows[0]?.requester??null,contributor:result.rows[0]?.contributor??null,revision:result.rows[0]?.revision??0};
}
