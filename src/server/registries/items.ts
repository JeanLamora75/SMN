import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {registryTypes,registryStatuses,type RegistryType} from "@/lib/registry-types";
import {obstacleTransition} from "@/lib/obstacle-lifecycle";
import {ensureCycleLinks} from "./cycle-links";
import {recordConfirmedHighlight} from "./confirmed-highlights";
import {parseInitialDetails,writeInitialDetails} from "./initial-details";
import {ensureRelations} from "./relations";

export type RegistryInput={type:RegistryType;title:string;occurredOn:string;status:string;description:string|null;owner:string|null;dueOn:string|null;comment:string|null;teamId:string;cycleId?:string};
const dateRx=/^\d{4}-\d{2}-\d{2}$/;
export function validDate(value:unknown):value is string{
 if(typeof value!=="string"||!dateRx.test(value))return false;
 const date=new Date(value+"T00:00:00.000Z");
 return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
const optional=(v:unknown,max:number)=>v===undefined||v===null||(typeof v==="string"&&v.length<=max);
export function parseRegistryInput(value:unknown):RegistryInput|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!["type","title","occurredOn","status","description","owner","dueOn","comment","teamId","cycleId"].includes(k)))return null;
 if(typeof v.type!=="string"||!registryTypes.some(x=>x===v.type))return null;
 const type=v.type as RegistryType;
 if(typeof v.title!=="string"||!v.title.trim()||v.title.trim().length>240||
  typeof v.teamId!=="string"||!v.teamId||v.teamId.length>80||
  (v.cycleId!==undefined&&(typeof v.cycleId!=="string"||!/^[a-f0-9-]{36}$/i.test(v.cycleId)||!["risk","obstacle"].includes(type)))||
  !validDate(v.occurredOn)||
  (v.status!==undefined&& (typeof v.status!=="string"||!registryStatuses[type].some(x=>x===v.status)))||
  !optional(v.description,4000)||!optional(v.owner,200)||!optional(v.comment,2000)||
  (v.dueOn!==undefined&&v.dueOn!==null&&!validDate(v.dueOn)))return null;
 return {type,title:v.title.trim(),teamId:v.teamId,cycleId:typeof v.cycleId==="string"?v.cycleId:undefined,occurredOn:v.occurredOn,
  status:typeof v.status==="string"?v.status:registryStatuses[type][0],
  description:typeof v.description==="string"?v.description:null,
  owner:typeof v.owner==="string"?v.owner:null,
  dueOn:typeof v.dueOn==="string"?v.dueOn:null,
  comment:typeof v.comment==="string"?v.comment:null};
}
/** Migration additive explicite, jamais appelée par un lecteur SELECT-only. */
export async function ensureRegistrySchema(db:Client):Promise<void>{
 await db.query("SELECT to_regclass('public.smn_registry_item') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-core-v32")});
 await db.query("SELECT to_regclass('public.smn_registry_item_team_type_date') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-core-v32")});
 await db.query("SELECT to_regclass('public.smn_registry_item_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-core-v32")});
}
/** Creation et revision initiale sont atomiques et propres à l'équipe installée. */
export async function createRegistryItem(db:Client,actorId:string,raw:unknown,requestId?:string){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const {details,sourceId,...fields}=raw as Record<string,unknown>;
 const input=parseRegistryInput(fields);
 if(!input||!actorId)return {ok:false as const,error:"invalid-input" as const};
 const parsed=parseInitialDetails(input.type,details,input.teamId);
 if(!parsed.ok||sourceId!==undefined&&
  (typeof sourceId!=="string"||!/^[0-9a-f-]{36}$/i.test(sourceId))||
  requestId!==undefined&&(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)||
   sourceId===undefined||!["action","decision","highlight"].includes(input.type)))
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE t.id=$1 AND i.id='singleton' AND i.state='initialized'
    AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
    AND lower(i.mode) IN ('scrum','kanban') FOR UPDATE OF t`,[input.teamId]);
  if(team.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(input.cycleId){
   const cycle=await db.query<{id:string}>(`SELECT id FROM public.smn_sprint
     WHERE id=$1 AND team_id=$2 AND deleted_at IS NULL AND status<>'closed' FOR UPDATE`,[input.cycleId,input.teamId]);
   if(cycle.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  }
  if(sourceId!==undefined){
   const source=await db.query<{id:string}>(`SELECT r.id FROM public.smn_registry_item r
    JOIN public.smn_team t ON t.id=r.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE r.id=$1 AND r.team_id=$2 AND i.id='singleton' AND i.state='initialized'
    FOR UPDATE OF r`,[sourceId,input.teamId]);
   if(source.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  }
  if(input.type==="decision"&&parsed.value.replacesId){
   const replaced=await db.query<{id:string}>(`SELECT r.id FROM public.smn_registry_item r
    WHERE r.id=$1 AND r.team_id=$2 AND r.type='decision'
    FOR UPDATE OF r`,[parsed.value.replacesId,input.teamId]);
   if(replaced.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  }
  await ensureRegistrySchema(db);
  const id=randomUUID();
  if(requestId!==undefined){
   // A retry with the same operation key must not create a second autonomous record.
   // The deferred FK is checked at COMMIT after the record is inserted below.
   await db.query("SELECT to_regclass('public.smn_registry_linked_request') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-core-v32")});
   const fingerprint=createHash("sha256").update(JSON.stringify({
    input,details:parsed.value,sourceId
   })).digest("hex");
   const claimed=await db.query<{request_id:string}>(`INSERT INTO public.smn_registry_linked_request
    (request_id,source_id,actor_id,request_fingerprint,new_item_id)
    VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING request_id`,
    [requestId,sourceId,actorId,fingerprint,id]);
   if(claimed.rows.length!==1){
    const existing=await db.query<{
     source_id:string;actor_id:string;request_fingerprint:string;new_item_id:string
    }>(`SELECT source_id,actor_id,request_fingerprint,new_item_id
       FROM public.smn_registry_linked_request WHERE request_id=$1`,[requestId]);
    await db.query("ROLLBACK");
    const previous=existing.rows[0];
    if(previous&&previous.source_id===sourceId&&previous.actor_id===actorId&&
     previous.request_fingerprint===fingerprint)
     return {ok:true as const,id:previous.new_item_id,revision:1,replayed:true as const};
    return {ok:false as const,error:"conflict" as const};
   }
  }
  await db.query(`INSERT INTO public.smn_registry_item
   (id,installation_id,team_id,type,title,occurred_on,status,description,owner_name,due_on,comment,created_by)
   VALUES($1,'singleton',$2,$3,$4,$5::date,$6,$7,$8,$9::date,$10,$11)`,
   [id,input.teamId,input.type,input.title,input.occurredOn,input.status,input.description,input.owner,input.dueOn,input.comment,actorId]);
  await db.query(`INSERT INTO public.smn_registry_item_audit
   (id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,1,NULL,$3::jsonb,$4)`,[randomUUID(),id,JSON.stringify(input),actorId]);
  if(input.cycleId){
   await ensureCycleLinks(db);
   await db.query(`INSERT INTO public.smn_registry_cycle_link(item_id,sprint_id) VALUES($1,$2)`,[id,input.cycleId]);
   await db.query(`INSERT INTO public.smn_registry_cycle_link_audit(id,item_id,sprint_id,action,actor_id)
     VALUES($1,$2,$3,'linked',$4)`,[randomUUID(),id,input.cycleId,actorId]);
  }
  await writeInitialDetails(db,actorId,id,input.type,parsed.value,input.title);
  if(sourceId!==undefined){
   await ensureRelations(db);
   await db.query(`INSERT INTO public.smn_registry_relation
    (id,source_id,target_kind,target_id) VALUES($1,$2,'record',$3)`,
    [randomUUID(),sourceId,id]);
   await db.query(`INSERT INTO public.smn_registry_relation_audit
    (id,source_id,target_kind,target_id,action,actor_id)
    VALUES($1,$2,'record',$3,'linked',$4)`,
    [randomUUID(),sourceId,id,actorId]);
  }
  if(input.type==="decision"&&input.status==="active")await recordConfirmedHighlight(db,{category:"recordedDecision",sourceKind:"registry",sourceId:id,sourceRevision:1,title:input.title,actorId});
  await db.query("COMMIT");return {ok:true as const,id,revision:1};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function readRegistryItem(db:Client,id:string){
 if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 const r=await db.query(`SELECT r.id,r.team_id AS "teamId",r.type,r.title,r.occurred_on::text AS "occurredOn",
 r.status,r.description,r.owner_name AS "owner",r.due_on::text AS "dueOn",
 r.comment,r.revision,r.created_at::text AS "createdAt",r.updated_at::text AS "updatedAt"
 FROM public.smn_registry_item r JOIN public.smn_team t ON t.id=r.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized'`,[id]);
 return r.rows[0]??null;
}

/** AC4: optimistic edit, immutable creation timestamp and append-only revisions. */
export async function updateRegistryItem(db:Client,actorId:string,id:string,revision:number,raw:unknown){
 const input=parseRegistryInput(raw);
 if(!input||!actorId||!Number.isSafeInteger(revision)||revision<1||
  !/^[0-9a-f-]{36}$/i.test(id))return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const prior=await db.query<{
   id:string;team_id:string;type:RegistryType;title:string;occurred_on:string;
   status:string;description:string|null;owner_name:string|null;due_on:string|null;
   comment:string|null;revision:number
  }>(`SELECT r.id,r.team_id,r.type,r.title,r.occurred_on::text,r.status,
   r.description,r.owner_name,r.due_on::text,r.comment,r.revision
   FROM public.smn_registry_item r JOIN public.smn_team t ON t.id=r.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized'
    AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
   FOR UPDATE OF r`,[id]);
  const old=prior.rows[0];
  if(!old||old.team_id!==input.teamId){
   await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};
  }
  if(old.type!==input.type){
   await db.query("ROLLBACK");return {ok:false as const,error:"immutable-type" as const};
  }
  if(old.type==="obstacle"&&!obstacleTransition(old.status,input.status).valid){
   await db.query("ROLLBACK");return {ok:false as const,error:"invalid-transition" as const};
  }
  if(old.revision!==revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  await db.query(`UPDATE public.smn_registry_item SET title=$2,occurred_on=$3::date,
   status=$4,description=$5,owner_name=$6,due_on=$7::date,comment=$8,
   revision=revision+1,updated_at=now() WHERE id=$1`,
   [id,input.title,input.occurredOn,input.status,input.description,input.owner,input.dueOn,input.comment]);
  await db.query(`INSERT INTO public.smn_registry_item_audit
   (id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
   [randomUUID(),id,revision+1,JSON.stringify({title:old.title,occurredOn:old.occurred_on,status:old.status,description:old.description,owner:old.owner_name,dueOn:old.due_on,comment:old.comment,teamId:old.team_id,type:old.type}),JSON.stringify(input),actorId]);
  if(input.type==="obstacle"&&old.status!=="resolved"&&input.status==="resolved")await recordConfirmedHighlight(db,{category:"resolvedObstacle",sourceKind:"registry",sourceId:id,sourceRevision:revision+1,title:input.title,actorId});
  if(input.type==="dependency"&&old.status!=="satisfied"&&input.status==="satisfied")await recordConfirmedHighlight(db,{category:"satisfiedDependency",sourceKind:"registry",sourceId:id,sourceRevision:revision+1,title:input.title,actorId});
  await db.query("COMMIT");return {ok:true as const,id,revision:revision+1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}

/** Historical revisions are read without writes, scoped to the installed team. */
export async function readRegistryHistory(db:Client,id:string){
 if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 const item=await db.query<{id:string}>(`SELECT r.id FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized'`,[id]);
 if(item.rows.length!==1)return null;
 const history=await db.query<{revision:number;changedAt:string;actorId:string|null;beforeValues:unknown;afterValues:unknown}>(`
 SELECT revision,changed_at::text AS "changedAt",actor_id AS "actorId",
 before_values AS "beforeValues",after_values AS "afterValues"
 FROM public.smn_registry_item_audit WHERE item_id=$1 ORDER BY revision DESC`,[id]);
 return {id,revisions:history.rows};
}
