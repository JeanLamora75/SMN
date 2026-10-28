import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {reviseRegistryComment} from "@/server/registries/comments";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const dynamic="force-dynamic";
export const runtime="nodejs";
type Context={params:Promise<{id:string;commentId:string}>};
async function changeComment(db:import("pg").Client,actor:{id:string;role:"admin"|"user"},req:NextRequest,
 id:string,commentId:string,action:"edit"|"withdraw",body:unknown){
 const teamId=req.nextUrl.searchParams.get("teamId");
 const context=await resolveRegistryReadContext(db,{accountId:actor.id,role:actor.role},teamId);
 if(context.version===28){
  if(!MULTI_TEAM_CONTEXT_READY||process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true")
   throw Error("registry-team-write-not-ready");
  if(!teamId||context.team?.team_id!==teamId)throw Error("registry-team-write-forbidden");
  return reviseRegistryComment(db,actor.id,id,commentId,action,body,{
   actor:{accountId:actor.id,role:actor.role},teamId
  });
 }
 await assertLegacyTeamApi(db);
 return reviseRegistryComment(db,actor.id,id,commentId,action,body);
}


export async function PATCH(req:NextRequest,{params}:Context){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,16384);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id,commentId}=await params;
 try{
  const result=await withAuthDb(db=>changeComment(db,actor,req,id,commentId,"edit",body));
  return jsonResult(result,result.ok?200:
   result.error==="conflict"?409:result.error==="withdrawn"?409:
   result.error==="not-found"?404:400);
  }catch(error){
  if(error instanceof Error&&error.message==="registry-team-write-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"service-unavailable"},503);
 }
}
/** HTTP DELETE marks withdrawn_at only. No physical SQL DELETE is performed. */
export async function DELETE(req:NextRequest,{params}:Context){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,16384);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id,commentId}=await params;
 try{
  const result=await withAuthDb(db=>changeComment(db,actor,req,id,commentId,"withdraw",body));
  return jsonResult(result,result.ok?200:
   result.error==="conflict"?409:result.error==="withdrawn"?409:
   result.error==="not-found"?404:400);
  }catch(error){
  if(error instanceof Error&&error.message==="registry-team-write-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"service-unavailable"},503);
 }
}
