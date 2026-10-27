import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createRegistryItem} from "@/server/registries/items";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {parseRegistryFilters,readRegistryPage} from "@/server/registries/list";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
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
   await assertLegacyTeamApi(db);
   return createRegistryItem(db,actor.id,raw);
  });
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:400);
 }catch(error){
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
