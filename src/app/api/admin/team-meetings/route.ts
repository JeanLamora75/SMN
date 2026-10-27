import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createTeamMeeting} from "@/server/teams/meeting-create";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;

/** Création Scrum/Kanban v28 ; aucune mutation en production avant recette.
 * Les anciennes routes restent gardées en v28.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")
  return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size!==0)
  return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,4096);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>createTeamMeeting(db,
   {accountId:actor.id,role:"admin"},body));
  if(result.ok)return jsonResult(result,201);
  return jsonResult({error:result.error},
   result.error==="invalid-input"?400:
   result.error==="not-found"||result.error==="mode-mismatch"?404:
   result.error==="closed-period"||result.error==="outside-period"||
   result.error==="conflict"?409:503);
 }catch(error){
  if(error instanceof Error&&[
   "team-context-unavailable","team-id-invalid",
   "team-context-not-ready","team-access-forbidden"
  ].includes(error.message))
   return jsonResult({error:"not-found"},404);
  console.error("team-meeting-create-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
