import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {renameSprint} from "@/server/sprints/rename";
export const dynamic="force-dynamic";
export async function PATCH(req:NextRequest,context:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await context.params;
 try{const result=await withLegacyTeamApi(db=>renameSprint(db,actor.id,id,input));
  return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"rename-unavailable"},503);}
}
