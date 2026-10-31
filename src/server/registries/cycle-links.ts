import {randomUUID} from "node:crypto";
import type {Client} from "pg";
export async function ensureCycleLinks(db:Client){
 await db.query("SELECT to_regclass('public.smn_registry_cycle_link') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
 await db.query("SELECT to_regclass('public.smn_registry_cycle_link_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
}
export async function readLinks(db:Client,id:string,teamId?:string){
 if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 const scope=await db.query<{teamId:string;type:string;occurredOn:string;dueOn:string|null}>(`SELECT r.team_id AS "teamId",r.type,r.occurred_on::text AS "occurredOn",r.due_on::text AS "dueOn" FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized' AND ($2::text IS NULL OR r.team_id=$2)`,[id,teamId??null]);
 const r=scope.rows[0];if(!r||!["risk","dependency","obstacle"].includes(r.type))return null;
 const resolution=await db.query<{resolvedOn:string|null}>(`
 SELECT CASE WHEN r.status IN ('resolved','satisfied') THEN
  (SELECT a.changed_at::date::text FROM public.smn_registry_item_audit a
   WHERE a.item_id=r.id AND a.after_values->>'status'=r.status
   AND (a.before_values IS NULL OR a.before_values->>'status' IS DISTINCT FROM r.status)
   ORDER BY a.revision DESC LIMIT 1) ELSE NULL END AS "resolvedOn"
 FROM public.smn_registry_item r WHERE r.id=$1 AND r.team_id=$2`,[id,r.teamId]);
 const resolvedOn=resolution.rows[0]?.resolvedOn??null;
 const cycles=await db.query<{id:string;name:string;status:string;startOn:string;endOn:string}>(`
 SELECT s.id,s.name,s.status,s.start_at::date::text AS "startOn",s.end_at::date::text AS "endOn" FROM public.smn_sprint s
 WHERE s.team_id=$1 AND s.deleted_at IS NULL
 AND ( (($3::date IS NULL OR s.start_at::date < $3::date) AND s.end_at::date > $2::date)
 OR EXISTS (SELECT 1 FROM public.smn_registry_cycle_link l WHERE l.item_id=$4 AND l.sprint_id=s.id))
 ORDER BY s.start_at DESC,s.id DESC`,[r.teamId,r.occurredOn,resolvedOn,id]);
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_registry_cycle_link') IS NOT NULL AS present`);
 const linked=exists.rows[0]?.present?await db.query<{sprint_id:string}>(`SELECT l.sprint_id FROM public.smn_registry_cycle_link l JOIN public.smn_sprint s ON s.id=l.sprint_id
 WHERE l.item_id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL`,[id,r.teamId]):{rows:[]};
 return {cycles:cycles.rows,linkedIds:linked.rows.map(x=>x.sprint_id)};
}
/** Explicit link/unlink only, never mutates registry data, sprint bounds or closure snapshots. */
export async function changeCycleLink(db:Client,actorId:string,id:string,cycleId:string,action:"linked"|"unlinked",teamId?:string){
 if(!actorId||!/^[0-9a-f-]{36}$/i.test(id)||!/^[0-9a-f-]{36}$/i.test(cycleId))return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const scope=await db.query<{id:string}>(`SELECT r.id FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 JOIN public.smn_sprint s ON s.team_id=r.team_id AND s.id=$2 AND s.deleted_at IS NULL
 WHERE r.id=$1 AND r.type IN ('risk','dependency','obstacle') AND i.id='singleton' AND i.state='initialized'
 AND ($3::text IS NULL OR r.team_id=$3)
 AND lower(COALESCE(NULLIF(to_jsonb(t)->>'agile_mode',''),to_jsonb(i)->>'mode')) IN ('scrum','kanban')
 AND s.status<>'closed'
 AND ($4::text='unlinked' OR (
 s.end_at::date > r.occurred_on
 AND (r.status NOT IN ('resolved','satisfied') OR s.start_at::date <
  COALESCE((SELECT a.changed_at::date FROM public.smn_registry_item_audit a
   WHERE a.item_id=r.id AND a.after_values->>'status'=r.status
   AND (a.before_values IS NULL OR a.before_values->>'status' IS DISTINCT FROM r.status)
   ORDER BY a.revision DESC LIMIT 1),r.updated_at::date)))) FOR UPDATE OF r,s`,[id,cycleId,teamId??null,action]);
 if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
 await ensureCycleLinks(db);
 const existing=await db.query(`SELECT 1 FROM public.smn_registry_cycle_link WHERE item_id=$1 AND sprint_id=$2`,[id,cycleId]);
 const present=existing.rows.length>0;
 if((action==="linked"&&present)||(action==="unlinked"&&!present)){
  await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
 }
 if(action==="linked")await db.query(`INSERT INTO public.smn_registry_cycle_link(item_id,sprint_id) VALUES($1,$2)`,[id,cycleId]);
 else await db.query(`DELETE FROM public.smn_registry_cycle_link WHERE item_id=$1 AND sprint_id=$2`,[id,cycleId]);
 await db.query(`INSERT INTO public.smn_registry_cycle_link_audit(id,item_id,sprint_id,action,actor_id) VALUES($1,$2,$3,$4,$5)`,[randomUUID(),id,cycleId,action,actorId]);
 await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
