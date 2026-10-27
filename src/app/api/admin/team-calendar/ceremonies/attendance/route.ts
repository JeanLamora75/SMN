import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {recordScopedCeremonyAttendance} from "@/server/teams/ceremony-attendance";
export const runtime="nodejs";
export async function PATCH(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size)return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,2048);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>recordScopedCeremonyAttendance(db,{accountId:actor.id,role:"admin"},body));
  return jsonResult(result,result.ok?200:
   result.error==="invalid-input"?400:result.error==="not-found"||result.error==="mode-mismatch"?404:409);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}
