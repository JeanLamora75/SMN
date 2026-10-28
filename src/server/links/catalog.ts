import "server-only";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam} from "@/server/teams/resolve";

export type LinkActor={id:string;role:"admin"|"user"};
import {LinkError,type LinkWrite,validId} from "./validation";
export {mapLinkError} from "./validation";
export {normalizeLink} from "./validation";

async function installation(db:Client,actor:LinkActor):Promise<string>{
 // Until user/team grants ship in V1, refuse all non-admin accounts.
 if(actor.role!=="admin"||!validId(actor.id))throw new LinkError("forbidden");
 const r=await db.query<{installation_id:string}>(`SELECT a.installation_id FROM public.smn_account a
 JOIN public.smn_installation i ON i.id=a.installation_id
 WHERE a.id=$1 AND a.role='admin' AND a.is_active=true
 AND a.must_change_password=false AND i.state='initialized' AND i.schema_version=29`,[actor.id]);
 if(r.rows.length!==1)throw new LinkError("not-ready");
 return r.rows[0].installation_id;
}
async function checkedTeam(db:Client,actor:LinkActor,teamId:string){
 if(!validId(teamId))throw new LinkError("not-found");
 await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},teamId);
}
async function checkedCategory(db:Client,tenant:string,id:string){
 const r=await db.query("SELECT 1 FROM public.smn_link_category WHERE id=$1 AND installation_id=$2",[id,tenant]);
 if(r.rowCount!==1)throw new LinkError("invalid-input");
}
export async function listLinks(db:Client,actor:LinkActor,teamId:string){
 const tenant=await installation(db,actor);
 await checkedTeam(db,actor,teamId);
 return (await db.query(`SELECT l.id,l.title,l.url,l.description,l.scope,
 l.team_id AS "teamId",c.id AS "categoryId",c.name AS "categoryName",
 l.created_at AS "createdAt",l.updated_at AS "updatedAt",l.revision
 FROM public.smn_link l JOIN public.smn_link_category c
 ON c.id=l.category_id AND c.installation_id=l.installation_id
 WHERE l.installation_id=$1 AND (l.scope='TRANSVERSE' OR l.team_id=$2)
 ORDER BY lower(l.title),l.id`,[tenant,teamId])).rows;
}
export async function getLink(db:Client,actor:LinkActor,teamId:string,id:string){
 if(!validId(id))throw new LinkError("not-found");
 const tenant=await installation(db,actor);
 await checkedTeam(db,actor,teamId);
 const r=await db.query(`SELECT l.id,l.title,l.url,l.description,l.scope,l.team_id AS "teamId",
 c.id AS "categoryId",c.name AS "categoryName",l.created_at AS "createdAt",
 l.updated_at AS "updatedAt",l.revision
 FROM public.smn_link l JOIN public.smn_link_category c
 ON c.id=l.category_id AND c.installation_id=l.installation_id
 WHERE l.id=$1 AND l.installation_id=$2 AND (l.scope='TRANSVERSE' OR l.team_id=$3)`,
 [id,tenant,teamId]);
 if(r.rowCount!==1)throw new LinkError("not-found");
 return r.rows[0];
}
export async function createLink(db:Client,actor:LinkActor,input:LinkWrite){
 const tenant=await installation(db,actor);
 if(input.scope==="EQUIPE")await checkedTeam(db,actor,input.teamId!);
 await db.query("BEGIN");
 try{
  await checkedCategory(db,tenant,input.categoryId);
  const id=randomUUID();
  const result=await db.query(`INSERT INTO public.smn_link
  (id,installation_id,title,url,description,category_id,scope,team_id,created_by,updated_by)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING *`,
  [id,tenant,input.title,input.url,input.description,input.categoryId,input.scope,input.teamId,actor.id]);
  await db.query(`INSERT INTO public.smn_link_audit
  (id,link_id,installation_id,operation,after_values,actor_id)
  VALUES($1,$2,$3,'CREATE',$4,$5)`,
  [randomUUID(),id,tenant,JSON.stringify(result.rows[0]),actor.id]);
  await db.query("COMMIT");
  return result.rows[0];
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function updateLink(db:Client,actor:LinkActor,id:string,input:LinkWrite,revision:number){
 const tenant=await installation(db,actor);
 if(!validId(id)||!Number.isSafeInteger(revision)||revision<1)throw new LinkError("invalid-input");
 if(input.scope==="EQUIPE")await checkedTeam(db,actor,input.teamId!);
 await db.query("BEGIN");
 try{
  const before=await db.query("SELECT * FROM public.smn_link WHERE id=$1 AND installation_id=$2 FOR UPDATE",[id,tenant]);
  if(before.rowCount!==1)throw new LinkError("not-found");
  if(before.rows[0].revision!==revision)throw new LinkError("conflict");
  await checkedCategory(db,tenant,input.categoryId);
  const after=await db.query(`UPDATE public.smn_link
  SET title=$3,url=$4,description=$5,category_id=$6,scope=$7,team_id=$8,
  updated_by=$9,updated_at=now(),revision=revision+1
  WHERE id=$1 AND installation_id=$2 RETURNING *`,
  [id,tenant,input.title,input.url,input.description,input.categoryId,input.scope,input.teamId,actor.id]);
  await db.query(`INSERT INTO public.smn_link_audit
  (id,link_id,installation_id,operation,before_values,after_values,actor_id)
  VALUES($1,$2,$3,'UPDATE',$4,$5,$6)`,
  [randomUUID(),id,tenant,JSON.stringify(before.rows[0]),JSON.stringify(after.rows[0]),actor.id]);
  await db.query("COMMIT");
  return after.rows[0];
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function deleteLink(db:Client,actor:LinkActor,id:string,revision:number){
 const tenant=await installation(db,actor);
 if(!validId(id)||!Number.isSafeInteger(revision)||revision<1)throw new LinkError("invalid-input");
 await db.query("BEGIN");
 try{
  const before=await db.query("SELECT * FROM public.smn_link WHERE id=$1 AND installation_id=$2 FOR UPDATE",[id,tenant]);
  if(before.rowCount!==1)throw new LinkError("not-found");
  if(before.rows[0].revision!==revision)throw new LinkError("conflict");
  await db.query("DELETE FROM public.smn_link WHERE id=$1 AND installation_id=$2",[id,tenant]);
  await db.query(`INSERT INTO public.smn_link_audit
  (id,link_id,installation_id,operation,before_values,actor_id)
  VALUES($1,$2,$3,'DELETE',$4,$5)`,
  [randomUUID(),id,tenant,JSON.stringify(before.rows[0]),actor.id]);
  await db.query("COMMIT");
  return {deleted:true};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
export async function listCategories(db:Client,actor:LinkActor){
 const tenant=await installation(db,actor);
 return (await db.query("SELECT id,name FROM public.smn_link_category WHERE installation_id=$1 ORDER BY lower(name),id",[tenant])).rows;
}
