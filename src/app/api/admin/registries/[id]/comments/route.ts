import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {withAuthDb} from "@/server/auth/database";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {authorizeRegistryRecord} from "@/server/registries/scoped-record";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readRegistryComments,createRegistryComment} from "@/server/registries/comments";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const result=await withSprintIndexDb(async db=>await authorizeRegistryRecord(db,{accountId:actor.id,role:actor.role},id)?readRegistryComments(db,id,actor.role==="admin"):null);
  return jsonResult(result??{error:"not-found"},result?200:404);
 }catch(error){
  if(error instanceof Error&&error.message==="registry-team-write-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,16384);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(async db=>{
   const requestedTeamId=req.nextUrl.searchParams.get("teamId");
   const context=await resolveRegistryReadContext(db,{
    accountId:actor.id,role:actor.role
   },requestedTeamId);
   if(context.version===28){
    if(context.version!==32&&(!MULTI_TEAM_CONTEXT_READY||
       process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true"))
     throw Error("registry-team-write-not-ready");
    if(!requestedTeamId||context.team?.team_id!==requestedTeamId)
     throw Error("registry-team-write-forbidden");
    return createRegistryComment(db,actor.id,id,body,{
     actor:{accountId:actor.id,role:actor.role},teamId:context.team.team_id
    });
   }
   await assertLegacyTeamApi(db);
   return createRegistryComment(db,actor.id,id,body);
  });
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:400);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}
