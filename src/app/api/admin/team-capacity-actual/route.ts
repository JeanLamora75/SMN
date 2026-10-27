import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {saveTeamActualCapacity} from "@/server/capacity/team-actual-write";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

/** POST distinct pour la capacité réelle en v28.
 * N'est pas disponible avant la qualification des consommateurs multiéquipes.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")
  return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size!==0)
  return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,2048);
 if(!body||Object.keys(body).length!==2||
    typeof body.teamId!=="string"||!Object.hasOwn(body,"change"))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>saveTeamActualCapacity(
   db,{accountId:actor.id,role:"admin"},body.teamId as string,body.change
  ));
  if(result.ok)return jsonResult(result,200);
  return jsonResult({error:result.error},
   result.error==="protected"?423:
   ["conflict","nothing-to-clear"].includes(result.error)?409:
   result.error==="team-unavailable"?404:400);
 }catch(error){
  if(error instanceof Error&&[
   "team-access-forbidden","team-context-unavailable",
   "team-context-not-ready","team-id-invalid"
  ].includes(error.message))
   return jsonResult({error:"not-found"},404);
  console.error("team-capacity-actual-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
