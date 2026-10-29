import {assertKanbanSchema} from "./schema-ready";
import type {Client} from "pg";
import {randomUUID} from "node:crypto";
import {ensureRegistrySchema} from "@/server/registries/items";
/**
 * Kanban qualitative links are explicit: never infer period membership from dates,
 * titles, Scrum sprint links or mere team membership.
 */
export async function ensureKanbanQualitativeLinks(db:Client){
 await ensureRegistrySchema(db);
 await assertKanbanSchema(db,"smn_kanban_registry_link");
}
export async function captureKanbanQualitative(db:Client,periodId:string,teamId:string){
 const schema=await db.query<{items:boolean;links:boolean}>(`
 SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS items,
 to_regclass('public.smn_kanban_registry_link') IS NOT NULL AS links`);
 if(!schema.rows[0]?.items||!schema.rows[0]?.links)
  return {state:"no-explicit-kanban-links" as const,items:[]};
 const rows=await db.query<{
  id:string;type:string;title:string;description:string|null;status:string;
  occurred_on:string|null;comment:string|null;revision:number
 }>(`SELECT r.id,r.type,r.title,r.description,r.status,
 r.occurred_on::text AS occurred_on,r.comment,r.revision
 FROM public.smn_kanban_registry_link l
 JOIN public.smn_registry_item r ON r.id=l.item_id
 WHERE l.period_id=$1 AND r.team_id=$2
 ORDER BY r.type,r.id`,[periodId,teamId]);
 return {state:"captured-explicit-links" as const,items:rows.rows};
}

export function parseKanbanLinkChange(raw:unknown):{itemId:string;action:"link"|"unlink"}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="action,itemId"||typeof v.itemId!=="string"||
 !/^[a-f0-9-]{36}$/i.test(v.itemId)||(v.action!=="link"&&v.action!=="unlink"))return null;
 return {itemId:v.itemId,action:v.action};
}
export async function ensureKanbanLinkAudit(db:Client){
 await ensureKanbanQualitativeLinks(db);
 await assertKanbanSchema(db,"smn_kanban_registry_link_audit");
}
export async function readKanbanLinkChoices(db:Client,periodId:string){
 const scope=await db.query<{team_id:string;status:string}>(`SELECT p.team_id,p.status
 FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode)='kanban'`,[periodId]);
 if(!scope.rows[0])return null;
 const tables=await db.query<{items:boolean;links:boolean}>(`SELECT
 to_regclass('public.smn_registry_item') IS NOT NULL AS items,
 to_regclass('public.smn_kanban_registry_link') IS NOT NULL AS links`);
 if(!tables.rows[0]?.items)return {status:scope.rows[0].status,items:[]};
 const items=await db.query<{id:string;type:string;title:string;status:string;linked:boolean}>(`
 SELECT r.id,r.type,r.title,r.status,${tables.rows[0].links?"(l.item_id IS NOT NULL)":"false"} AS linked
 FROM public.smn_registry_item r
 ${tables.rows[0].links?"LEFT JOIN public.smn_kanban_registry_link l ON l.item_id=r.id AND l.period_id=$2":""}
 WHERE r.team_id=$1 AND r.installation_id='singleton'
 ORDER BY r.type,r.occurred_on DESC,r.id LIMIT 500`,[scope.rows[0].team_id,...(tables.rows[0].links?[periodId]:[])]);
 return {status:scope.rows[0].status,items:items.rows};
}
export async function changeKanbanQualitativeLink(db:Client,actorId:string,periodId:string,raw:unknown){
 const change=parseKanbanLinkChange(raw);
 if(!actorId||!change)return {ok:false as const,error:"invalid-input"};
 await ensureKanbanLinkAudit(db);
 await db.query("BEGIN");
 try{
  const scope=await db.query<{team_id:string;status:string}>(`
  SELECT p.team_id,p.status FROM public.smn_kanban_period p
  JOIN public.smn_team t ON t.id=p.team_id JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE p.id=$1 AND p.deleted_at IS NULL AND i.id='singleton'
  AND i.state='initialized' AND lower(i.mode)='kanban' FOR UPDATE OF p`,[periodId]);
  const period=scope.rows[0];
  if(!period){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(period.status==="closed"){await db.query("ROLLBACK");return {ok:false as const,error:"closed-period"};}
  const item=await db.query<{id:string}>(`SELECT id FROM public.smn_registry_item
   WHERE id=$1 AND team_id=$2 AND installation_id='singleton'`,[change.itemId,period.team_id]);
  if(!item.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const existing=await db.query(`SELECT 1 FROM public.smn_kanban_registry_link WHERE period_id=$1 AND item_id=$2`,[periodId,change.itemId]);
  if((change.action==="link")===Boolean(existing.rows.length)){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};
  }
  if(change.action==="link")await db.query(`INSERT INTO public.smn_kanban_registry_link(period_id,item_id) VALUES($1,$2)`,[periodId,change.itemId]);
  else await db.query(`DELETE FROM public.smn_kanban_registry_link WHERE period_id=$1 AND item_id=$2`,[periodId,change.itemId]);
  await db.query(`INSERT INTO public.smn_kanban_registry_link_audit(id,period_id,item_id,action,actor_id)
  VALUES($1,$2,$3,$4,$5)`,[randomUUID(),periodId,change.itemId,change.action==="link"?"linked":"unlinked",actorId]);
  await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
