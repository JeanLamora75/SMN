import type {Client} from "pg";
import {resolveRegistryReadContext} from "./team-access";
import type {TeamActor} from "@/server/teams/resolve";

/** Verify that a record belongs to the administrator's resolved active team. */
export async function authorizeRegistryRecord(db:Client,actor:TeamActor,id:string):Promise<string|null>{
 const context=await resolveRegistryReadContext(db,actor,null);
 if(context.version!==28)return null;
 const teamId=context.team?.team_id;
 if(!teamId)return null;
 const result=await db.query<{id:string}>(`SELECT r.id FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id
 WHERE r.id=$1 AND r.team_id=$2 AND t.installation_id='singleton'
 AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false`,[id,teamId]);
 return result.rows.length===1?teamId:null;
}
