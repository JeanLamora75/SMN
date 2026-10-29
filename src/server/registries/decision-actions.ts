import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseRegistryInput,ensureRegistrySchema} from "@/server/registries/items";
/** Each confirmation makes one autonomous action and one audited link, atomically. */
export async function createActionFromDecision(db:Client,actorId:string,decisionId:string,raw:unknown){
 const input=parseRegistryInput(raw);
 if(!actorId||!/^[0-9a-f-]{36}$/i.test(decisionId)||!input||input.type!=="action"||input.status!=="todo")
  return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const source=await db.query(`SELECT r.id FROM public.smn_registry_item r
   JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND r.type='decision' AND r.team_id=$2 AND i.id='singleton' AND i.state='initialized' FOR UPDATE OF r`,[decisionId,input.teamId]);
  if(source.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await ensureRegistrySchema(db);
  await db.query("SELECT to_regclass('public.smn_action_link') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
  await db.query("SELECT to_regclass('public.smn_action_link_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_registry_item
   (id,installation_id,team_id,type,title,occurred_on,status,description,owner_name,due_on,comment,created_by)
   VALUES($1,'singleton',$2,'action',$3,$4::date,'todo',$5,$6,$7::date,$8,$9)`,
   [id,input.teamId,input.title,input.occurredOn,input.description,input.owner,input.dueOn,input.comment,actorId]);
  await db.query(`INSERT INTO public.smn_registry_item_audit
   (id,item_id,revision,before_values,after_values,actor_id) VALUES($1,$2,1,NULL,$3::jsonb,$4)`,
   [randomUUID(),id,JSON.stringify(input),actorId]);
  await db.query(`INSERT INTO public.smn_action_link(action_id,related_id) VALUES($1,$2)`,[id,decisionId]);
  await db.query(`INSERT INTO public.smn_action_link_audit(id,action_id,related_id,action,actor_id)
   VALUES($1,$2,$3,'linked',$4)`,[randomUUID(),id,decisionId,actorId]);
  await db.query("COMMIT");return {ok:true as const,id,decisionId};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
