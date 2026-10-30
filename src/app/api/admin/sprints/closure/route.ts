import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withAuthDb} from "@/server/auth/database";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {listSprintClosures,changeSprintClosure} from "@/server/sprints/closure";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 const id=req.nextUrl.searchParams.get("sprintId");if(!id||!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>listSprintClosures(db,id));return jsonResult(r??{error:"not-found"},r?200:404);}catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);if(!input)return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 try{
  const r=await withAuthDb(async db=>{
   const context=await resolveRegistryReadContext(db,{accountId:actor.id,role:actor.role},teamId);
   if(context.version>=28&&context.version<=32){
    if(!teamId||context.team?.team_id!==teamId)return {ok:false as const,error:"not-found"};
    return changeSprintClosure(db,actor.id,input,{actor:{accountId:actor.id,role:actor.role},teamId});
   }
   return changeSprintClosure(db,actor.id,input);
  });
  return jsonResult(r,r.ok?200:r.error==="not-found"?404:409);
 }catch(error){console.error("sprint-closure-save-failed",error instanceof Error?error.message:String(error));return jsonResult({error:"unavailable"},503);}
}
