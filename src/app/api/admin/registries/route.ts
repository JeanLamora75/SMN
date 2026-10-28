import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createRegistryItem} from "@/server/registries/items";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {parseRegistryFilters,readRegistryPage} from "@/server/registries/list";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const input=raw as Record<string,unknown>;
   const requestedTeamId=typeof input.teamId==="string"?input.teamId:null;
   const context=await resolveRegistryReadContext(db,{
    accountId:actor.id,role:actor.role
   },requestedTeamId);
   if(context.version===28){
    if(!MULTI_TEAM_CONTEXT_READY||
       process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true")
     throw Error("registry-team-write-not-ready");
    if(!requestedTeamId||context.team?.team_id!==requestedTeamId)
     throw Error("registry-team-write-forbidden");
   }else await assertLegacyTeamApi(db);
   return createRegistryItem(db,actor.id,raw);
  });
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:400);
 }catch(error){
  if(error instanceof Error&&error.message==="registry-team-write-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  console.error("smn-registry-create-unavailable",error instanceof Error?error.name:"unknown");
  return jsonResult({error:"service-unavailable"},503);
 }
}

export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const filters=parseRegistryFilters(req.nextUrl.searchParams);
 if(!filters||req.nextUrl.searchParams.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  const teamId=req.nextUrl.searchParams.get("teamId");
  const result=await withSprintIndexDb(async db=>{
   const context=await resolveRegistryReadContext(db,{
    accountId:actor.id,role:actor.role
   },teamId);
   return readRegistryPage(db,filters,actor.role==="admin",context.team);
  });
  return jsonResult(result,result.state==="forbidden"?403:200);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
