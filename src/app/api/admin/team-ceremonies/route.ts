import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {readTeamCeremonies} from "@/server/teams/ceremonies-read";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;

/** Inventaire v28 des cérémonies/occurrences filtrées ; aucun éditeur ouvert. */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 const params=request.nextUrl.searchParams;
 if(params.size!==2||params.getAll("teamId").length!==1||
    params.getAll("sprintId").length!==1)
  return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withAuthDb(db=>readTeamCeremonies(db,
   {accountId:actor.id,role:"admin"},
   params.get("teamId")!,params.get("sprintId")!)));
 }catch(error){
  if(error instanceof Error&&[
   "team-ceremony-invalid-input","team-ceremony-sprint-not-found",
   "team-ceremony-mode-invalid","team-context-unavailable",
   "team-id-invalid","team-access-forbidden"
  ].includes(error.message))return jsonResult({error:"not-found"},404);
  console.error("team-ceremonies-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
