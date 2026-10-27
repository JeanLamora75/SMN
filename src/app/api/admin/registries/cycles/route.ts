import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult} from "@/server/auth/request";
import {readRegistryCycles} from "@/server/registries/list";
import {resolveRegistryReadContext} from "@/server/registries/team-access";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 if([...req.nextUrl.searchParams.keys()].some(k=>k!=="teamId")||
    req.nextUrl.searchParams.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withSprintIndexDb(async db=>{
   const context=await resolveRegistryReadContext(db,{
    accountId:actor.id,role:actor.role
   },req.nextUrl.searchParams.get("teamId"));
   return readRegistryCycles(db,context.team);
  });
  return jsonResult(result,result.state==="available"?200:503);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}
