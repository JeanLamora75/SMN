import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readTeamClosureReadiness} from "@/server/teams/closure-readiness";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;

/** Diagnostic de préparation, pas une commande de clôture. */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")
  return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 const params=request.nextUrl.searchParams;
 if(params.size!==2||params.getAll("teamId").length!==1||
    params.getAll("cycleId").length!==1)
  return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withAuthDb(db=>readTeamClosureReadiness(db,
   {accountId:actor.id,role:"admin"},
   params.get("teamId")!,params.get("cycleId")!)));
 }catch(error){
  if(error instanceof Error&&[
   "team-context-unavailable","team-id-invalid","team-access-forbidden",
   "period-readiness-not-found","period-readiness-invalid-input"
  ].includes(error.message))return jsonResult({error:"not-found"},404);
  console.error("team-period-closure-readiness-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
