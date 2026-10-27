import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {createScopedCeremonyOutcome} from "@/server/teams/ceremony-outcomes-create";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size!==0)return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,4096);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>createScopedCeremonyOutcome(db,{accountId:actor.id,role:"admin"},body));
  return jsonResult(result,result.ok?201:result.error==="invalid-input"?400:result.error==="closed-period"?409:result.error==="storage-unavailable"?503:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}