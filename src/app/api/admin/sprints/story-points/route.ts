import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {readStoryPoints,writeStoryPoints} from "@/server/sprints/story-points";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=req.nextUrl.searchParams;
 const id=params.get("sprintId");
 if(!id||[...params.keys()].some(k=>!["sprintId","teamId"].includes(k))||
  params.getAll("sprintId").length!==1||params.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 try{
  const r=await withAuthDb(async db=>{
   const context=await resolveRegistryReadContext(db,
    {accountId:actor.id,role:actor.role},params.get("teamId"));
   return readStoryPoints(db,id,context.version>=28&&context.version<=32?{
    actor:{accountId:actor.id,role:actor.role},teamId:context.team!.team_id
   }:undefined);
  });
  return jsonResult(r??{error:"not-found"},r?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=req.nextUrl.searchParams;
 if([...params.keys()].some(k=>k!=="teamId")||params.getAll("teamId").length>1)
  return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const r=await withAuthDb(async db=>{
   const context=await resolveRegistryReadContext(db,
    {accountId:actor.id,role:actor.role},params.get("teamId"));
   if(context.version>=28&&context.version<=32){
    if(context.version===28&&(!MULTI_TEAM_CONTEXT_READY||process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true"))
     throw Error("context-not-ready");
    if(!params.get("teamId")||context.team?.team_id!==params.get("teamId"))
     throw Error("team-access-forbidden");
    return writeStoryPoints(db,actor.id,body,{
     actor:{accountId:actor.id,role:actor.role},teamId:context.team.team_id
    });
   }
   return writeStoryPoints(db,actor.id,body);
  });
  return jsonResult(r,r.ok?200:r.error==="closed-period"||r.error==="conflict"?409:
   r.error==="not-found"?404:400);
 }catch(error){
  if(error instanceof Error&&error.message==="context-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"unavailable"},503);
 }
}
