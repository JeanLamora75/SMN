import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {renameSprint} from "@/server/sprints/rename";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
export const dynamic="force-dynamic";
export async function PATCH(req:NextRequest,context:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await context.params;
 const teamId=req.nextUrl.searchParams.get("teamId");
 try{const result=await withAuthDb(async db=>{
  const context=await resolveRegistryReadContext(db,{accountId:actor.id,role:actor.role},teamId);
  if(context.version>=28&&context.version<=32){
   if(!teamId||context.team?.team_id!==teamId)return {ok:false as const,error:"not-found" as const};
   return renameSprint(db,actor.id,id,input,{actor:{accountId:actor.id,role:actor.role},teamId});
  }
  return renameSprint(db,actor.id,id,input);
 });
  return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"rename-unavailable"},503);}
}
