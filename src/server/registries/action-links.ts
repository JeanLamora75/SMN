import {randomUUID} from "node:crypto";
import type {Client} from "pg";
export const actionIsLate=(status:string,dueOn:string|null,today:string)=>status!=="completed"&&status!=="cancelled"&&dueOn!==null&&dueOn<today;
export async function readActionLinks(db:Client,id:string){
 const scope=await db.query(`SELECT r.id FROM public.smn_registry_item r JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id WHERE r.id=$1 AND r.type='action' AND i.id='singleton' AND i.state='initialized'`,[id]);
 if(!scope.rows.length)return null;
 const installed=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_action_link') IS NOT NULL AS present`);
 if(!installed.rows[0]?.present)return {links:[]};
 const links=await db.query<{id:string;title:string;type:string}>(`SELECT r.id,r.title,r.type
  FROM public.smn_action_link l
  JOIN public.smn_registry_item a ON a.id=l.action_id
  JOIN public.smn_registry_item r ON r.id=l.related_id AND r.team_id=a.team_id
  WHERE l.action_id=$1 AND r.type IN ('decision','obstacle')
  ORDER BY r.type,r.title,r.id`,[id]);
 return {links:links.rows};
}
export async function changeActionLink(db:Client,actorId:string,id:string,relatedId:string,action:"linked"|"unlinked"){
 if(!actorId||!(/^[0-9a-f-]{36}$/i.test(id)&&/^[0-9a-f-]{36}$/i.test(relatedId)))return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const scope=await db.query(`SELECT a.id FROM public.smn_registry_item a JOIN public.smn_registry_item b ON b.id=$2 AND b.team_id=a.team_id AND b.type IN ('decision','obstacle')
   JOIN public.smn_team t ON t.id=a.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE a.id=$1 AND a.type='action' AND i.id='singleton' AND i.state='initialized' FOR UPDATE OF a,b`,[id,relatedId]);
  if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await db.query("SELECT to_regclass('public.smn_action_link') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
  await db.query("SELECT to_regclass('public.smn_action_link_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
  const current=await db.query(`SELECT 1 FROM public.smn_action_link WHERE action_id=$1 AND related_id=$2`,[id,relatedId]);
  if((action==="linked")===!!current.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  if(action==="linked")await db.query(`INSERT INTO public.smn_action_link(action_id,related_id) VALUES($1,$2)`,[id,relatedId]);
  else await db.query(`DELETE FROM public.smn_action_link WHERE action_id=$1 AND related_id=$2`,[id,relatedId]);
  await db.query(`INSERT INTO public.smn_action_link_audit(id,action_id,related_id,action,actor_id) VALUES($1,$2,$3,$4,$5)`,[randomUUID(),id,relatedId,action,actorId]);
  await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
