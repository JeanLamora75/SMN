import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {writeSprintScores} from "@/server/sprints/sprint-scores";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;

export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const params=req.nextUrl.searchParams;
   if([...params.keys()].some(k=>k!=="teamId")||params.getAll("teamId").length>1)
    return {ok:false as const,error:"invalid-input" as const};
   const teamId=params.get("teamId");
   const context=await resolveRegistryReadContext(db,
    {accountId:actor.id,role:actor.role},teamId);
   if(context.version>=28&&context.version<=32){
    if(context.version===28&&(!MULTI_TEAM_CONTEXT_READY||process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true"))
     throw Error("context-not-ready");
    if(!teamId||context.team?.team_id!==teamId)throw Error("team-access-forbidden");
    return writeSprintScores(db,actor.id,raw,{
     actor:{accountId:actor.id,role:actor.role},teamId
    });
   }
   return writeSprintScores(db,actor.id,raw);
  });
  return jsonResult(result,result.ok?200:
   result.error==="closed-period"||result.error==="conflict"?409:
   result.error==="not-found"?404:400);
 }catch(error){
  if(error instanceof Error&&error.message==="context-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"unavailable"},503);
 }
}
