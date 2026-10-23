import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseRegistryInput,ensureRegistrySchema} from "@/server/registries/items";
import {ensureRelations} from "@/server/registries/relations";
/** Creates obstacle and bidirectional-readable relation in one atomic transaction. */
export async function createObstacleFromRisk(db:Client,actorId:string,riskId:string,raw:unknown){
 const item=parseRegistryInput(raw);
 if(!actorId||!/^[0-9a-f-]{36}$/i.test(riskId)||!item||item.type!=="obstacle"||item.status!=="open")
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const risk=await db.query<{id:string;team_id:string}>(`SELECT r.id,r.team_id FROM public.smn_registry_item r
   JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND r.type='risk' AND r.team_id=$2
   AND i.id='singleton' AND i.state='initialized' FOR UPDATE OF r`,[riskId,item.teamId]);
  if(risk.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await ensureRegistrySchema(db);await ensureRelations(db);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_registry_item
  (id,installation_id,team_id,type,title,occurred_on,status,description,owner_name,due_on,comment,created_by)
  VALUES($1,'singleton',$2,'obstacle',$3,$4::date,'open',$5,$6,$7::date,$8,$9)`,
  [id,item.teamId,item.title,item.occurredOn,item.description,item.owner,item.dueOn,item.comment,actorId]);
  await db.query(`INSERT INTO public.smn_registry_item_audit
   (id,item_id,revision,before_values,after_values,actor_id)
   VALUES($1,$2,1,NULL,$3::jsonb,$4)`,[randomUUID(),id,JSON.stringify(item),actorId]);
  await db.query(`INSERT INTO public.smn_registry_relation(id,source_id,target_kind,target_id)
   VALUES($1,$2,'record',$3)`,[randomUUID(),riskId,id]);
  await db.query(`INSERT INTO public.smn_registry_relation_audit
   (id,source_id,target_kind,target_id,action,actor_id) VALUES($1,$2,'record',$3,'linked',$4)`,
   [randomUUID(),riskId,id,actorId]);
  await db.query("COMMIT");return {ok:true as const,id,riskId,revision:1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
