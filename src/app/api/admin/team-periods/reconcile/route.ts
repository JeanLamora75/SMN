import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {reconcileAuthorizedTeamPeriods} from "@/server/teams/period-state";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;

/** Transitions automatiques équipe v28. Pas de clôture métier.
 * Verrou de livraison testé AVANT toute lecture de la base.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size!==0)
  return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,512);
 if(!body||Object.keys(body).length!==1||typeof body.teamId!=="string")
  return jsonResult({error:"invalid-input"},400);
 try{
  const data=await withAuthDb(db=>reconcileAuthorizedTeamPeriods(db,
   {accountId:actor.id,role:"admin"},body.teamId as string));
  return jsonResult(data);
 }catch(error){
  if(error instanceof Error&&[
   "team-context-unavailable","team-id-invalid","team-access-forbidden",
   "team-context-not-ready"
  ].includes(error.message))return jsonResult({error:"not-found"},404);
  console.error("team-period-transition-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
