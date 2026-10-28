import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintSchema} from "./creation";

export async function listSprintsForRename(db:Client){
 await ensureSprintSchema(db);
 const r=await db.query<{id:string;name:string;status:string;start_at:string;end_at:string;time_zone:string}>(`SELECT s.id,s.name,s.status,s.start_at::text,s.end_at::text,s.time_zone FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND i.schema_version<=27 AND lower(i.mode)='scrum' ORDER BY s.start_at DESC LIMIT 100`);
 return r.rows.map(x=>({id:x.id,name:x.name,status:x.status,startAt:x.start_at,endAt:x.end_at,timeZone:x.time_zone}));
}
export async function renameSprint(db:Client,actorId:string,id:string,raw:unknown){
 if(!/^[0-9a-f-]{36}$/i.test(id)||!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).length!==1||typeof o.name!=="string"||o.name.trim().length<1||o.name.trim().length>160)return {ok:false as const,error:"invalid-input" as const};
 const name=o.name.trim();
 await ensureSprintSchema(db);
 await db.query("BEGIN");
 try{
  const current=await db.query<{id:string;team_id:string;name:string;status:string}>(`SELECT s.id,s.team_id,s.name,s.status FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND i.schema_version<=27 AND lower(i.mode)='scrum' FOR UPDATE OF s`,[id]);
  const before=current.rows[0];
  if(!before){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  const duplicate=await db.query<{id:string}>(`SELECT id FROM public.smn_sprint WHERE team_id=$1 AND deleted_at IS NULL AND id<>$2 AND lower(name)=lower($3) LIMIT 1`,[before.team_id,id,name]);
  if(before.name!==name){
   await db.query("UPDATE public.smn_sprint SET name=$2 WHERE id=$1",[id,name]);
   await db.query(`INSERT INTO public.smn_sprint_audit(id,sprint_id,action,actor_id,details)
   VALUES($1,$2,'renamed',$3,$4::jsonb)`,[randomUUID(),id,actorId,JSON.stringify({previousName:before.name,newName:name,status:before.status})]);
  }
  await db.query("COMMIT");
  return {ok:true as const,sprint:{id,name,status:before.status},duplicate:duplicate.rows.length>0,changed:before.name!==name};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
