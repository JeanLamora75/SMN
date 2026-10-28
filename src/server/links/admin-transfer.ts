import "server-only";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {resolveAdminTeam} from "@/server/teams/resolve";
import type {LinkActor} from "./catalog";
import {LinkError,validId} from "./validation";

export type TransferInput={scope:"TRANSVERSE"|"EQUIPE";teamId:string|null;revision:number};
/** Atomic admin conversion/transfer. Current installation only, optimistic revision + audit. */
export async function transferAdminLink(db:Client,actor:LinkActor,id:string,input:TransferInput){
 if(actor.role!=="admin"||!validId(actor.id))throw new LinkError("forbidden");
 if(!input||typeof input!=="object"||!validId(id)||!Number.isSafeInteger(input.revision)||input.revision<1||
  !["TRANSVERSE","EQUIPE"].includes(input.scope)||
  (input.scope==="TRANSVERSE"&&input.teamId!==null)||
  (input.scope==="EQUIPE"&&!validId(input.teamId)))throw new LinkError("invalid-input");
 await resolveAdminTeam(db,{accountId:actor.id,role:"admin"});
 if(input.teamId)await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},input.teamId);
 await db.query("BEGIN");
 try{
  const current=await db.query(`SELECT l.* FROM public.smn_link l
    JOIN public.smn_account a ON a.installation_id=l.installation_id
    JOIN public.smn_installation i ON i.id=l.installation_id
    WHERE l.id=$1 AND a.id=$2 AND a.role='admin'
    AND a.is_active=true AND a.must_change_password=false
    AND i.state='initialized' AND i.schema_version=29
    FOR UPDATE OF l`,[id,actor.id]);
  if(current.rowCount!==1)throw new LinkError("not-found");
  const before=current.rows[0];
  if(before.revision!==input.revision)throw new LinkError("conflict");
  if(before.scope===input.scope&&before.team_id===input.teamId)throw new LinkError("invalid-input");
  // Explicitly validate source team even for conversions to transverse.
  if(before.team_id)await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},before.team_id);
  const after=await db.query(`UPDATE public.smn_link SET scope=$3,team_id=$4,
    revision=revision+1,updated_by=$5,updated_at=now()
    WHERE id=$1 AND installation_id=$2 AND revision=$6 RETURNING *`,
    [id,before.installation_id,input.scope,input.teamId,actor.id,input.revision]);
  if(after.rowCount!==1)throw new LinkError("conflict");
  await db.query(`INSERT INTO public.smn_link_audit
    (id,link_id,installation_id,operation,before_values,after_values,actor_id)
    VALUES($1,$2,$3,'UPDATE',$4,$5,$6)`,
    [randomUUID(),id,before.installation_id,JSON.stringify(before),JSON.stringify(after.rows[0]),actor.id]);
  await db.query("COMMIT");
  return {id,revision:after.rows[0].revision,scope:input.scope,teamId:input.teamId};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
