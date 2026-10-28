import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {saveKanbanMetrics} from "@/server/kanban/metrics-block";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
export const dynamic="force-dynamic";
export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(async db=>{
   const params=request.nextUrl.searchParams;
   if([...params.keys()].some(k=>k!=="teamId")||params.getAll("teamId").length>1)
    return {ok:false as const,error:"invalid-input" as const};
   const teamId=params.get("teamId");
   const context=await resolveRegistryReadContext(db,
    {accountId:actor.id,role:actor.role},teamId);
   if(context.version===28){
    if(!MULTI_TEAM_CONTEXT_READY||process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true")
     throw Error("context-not-ready");
    if(!teamId||context.team?.team_id!==teamId)throw Error("team-access-forbidden");
    return saveKanbanMetrics(db,id,actor.id,input,{
     actor:{accountId:actor.id,role:actor.role},teamId
    });
   }
   return saveKanbanMetrics(db,id,actor.id,input);
  });
  return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:result.error==="closed-period"?409:400);
 }catch(error){
  if(error instanceof Error&&error.message==="context-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"service-unavailable"},503);
 }
}
