import "server-only";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {LinkError,validId} from "./validation";
import type {LinkActor} from "./catalog";

async function tenantFor(db:Client,actor:LinkActor){
 if(actor.role!=="admin"||!validId(actor.id))throw new LinkError("forbidden");
 await resolveAdminTeam(db,{accountId:actor.id,role:"admin"});
 const r=await db.query<{installation_id:string}>(`SELECT a.installation_id FROM public.smn_account a
 JOIN public.smn_installation i ON i.id=a.installation_id
 WHERE a.id=$1 AND a.role='admin' AND a.is_active=true
 AND a.must_change_password=false AND i.state='initialized' AND i.schema_version=29`,[actor.id]);
 if(r.rowCount!==1)throw new LinkError("not-ready");
 return r.rows[0].installation_id;
}
function nameOf(name:unknown){
 if(typeof name!=="string"||!name.trim()||name.trim().length>100)throw new LinkError("invalid-input");
 return name.trim();
}
export async function listCategoryUsage(db:Client,actor:LinkActor){
 const tenant=await tenantFor(db,actor);
 return (await db.query(`SELECT c.id,c.name,count(l.id)::int AS "linkCount"
 FROM public.smn_link_category c LEFT JOIN public.smn_link l
 ON l.category_id=c.id AND l.installation_id=c.installation_id
 WHERE c.installation_id=$1 GROUP BY c.id,c.name ORDER BY lower(c.name),c.id`,[tenant])).rows;
}
export async function createCategory(db:Client,actor:LinkActor,name:unknown){
 const tenant=await tenantFor(db,actor),id=randomUUID();
 const r=await db.query(`INSERT INTO public.smn_link_category(id,installation_id,name)
 VALUES($1,$2,$3) RETURNING id,name`,[id,tenant,nameOf(name)]);
 return r.rows[0];
}
export async function renameCategory(db:Client,actor:LinkActor,id:string,name:unknown){
 const tenant=await tenantFor(db,actor);
 if(!validId(id))throw new LinkError("invalid-input");
 const r=await db.query(`UPDATE public.smn_link_category SET name=$3,updated_at=now()
 WHERE id=$1 AND installation_id=$2 RETURNING id,name`,[id,tenant,nameOf(name)]);
 if(r.rowCount!==1)throw new LinkError("not-found");
 return r.rows[0];
}
export async function deleteCategory(db:Client,actor:LinkActor,id:string){
 const tenant=await tenantFor(db,actor);
 if(!validId(id))throw new LinkError("invalid-input");
 await db.query("BEGIN");
 try{
  const category=await db.query(`SELECT id FROM public.smn_link_category
   WHERE id=$1 AND installation_id=$2 FOR UPDATE`,[id,tenant]);
  if(category.rowCount!==1)throw new LinkError("not-found");
  const usage=await db.query<{link_count:string}>(`SELECT count(*)::text AS link_count FROM public.smn_link
 WHERE category_id=$1 AND installation_id=$2`,[id,tenant]);
  if(Number(usage.rows[0]?.link_count)>0)throw new LinkError("conflict");
  const r=await db.query(`DELETE FROM public.smn_link_category
 WHERE id=$1 AND installation_id=$2 RETURNING id`,[id,tenant]);
  if(r.rowCount!==1)throw new LinkError("not-found");
  await db.query("COMMIT");return {deleted:true};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if((error as {code?:unknown})?.code==="23503")throw new LinkError("conflict");
  throw error;
 }
}

/** Reassign all links atomically, preserving revisions and recording each change. */
export async function reassignCategory(db:Client,actor:LinkActor,sourceId:string,targetId:string){
 const tenant=await tenantFor(db,actor);
 if(!validId(sourceId)||!validId(targetId)||sourceId===targetId)throw new LinkError("invalid-input");
 await db.query("BEGIN");
 try{
  // Lock categories to serialize concurrent reassignments / deletions.
  const cats=await db.query(`SELECT id FROM public.smn_link_category
   WHERE installation_id=$1 AND id IN ($2,$3) ORDER BY id FOR UPDATE`,[tenant,sourceId,targetId]);
  if(cats.rowCount!==2)throw new LinkError("not-found");
  const affected=await db.query(`SELECT * FROM public.smn_link
   WHERE installation_id=$1 AND category_id=$2 ORDER BY id FOR UPDATE`,[tenant,sourceId]);
  for(const before of affected.rows){
   const after=await db.query(`UPDATE public.smn_link
    SET category_id=$3,updated_at=now(),updated_by=$4,revision=revision+1
    WHERE installation_id=$1 AND id=$2 RETURNING *`,
    [tenant,before.id,targetId,actor.id]);
   if(after.rowCount!==1)throw new LinkError("conflict");
   await db.query(`INSERT INTO public.smn_link_audit
    (id,link_id,installation_id,operation,before_values,after_values,actor_id)
    VALUES($1,$2,$3,'UPDATE',$4,$5,$6)`,
    [randomUUID(),before.id,tenant,JSON.stringify(before),JSON.stringify(after.rows[0]),actor.id]);
  }
  await db.query("COMMIT");
  return {reassigned:affected.rows.length};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
