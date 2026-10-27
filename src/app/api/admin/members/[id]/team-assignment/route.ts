import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {saveTeamAssignmentRevision} from "@/server/members/team-assignment-write";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

/** Nouvelle mutation d'affectation v28 : inaccessible tant que tous les
 * consommateurs de données multiéquipes n'ont pas été qualifiés.
 * L'ancienne API membre/assignment reste fermée en v28.
 */
export async function POST(request:NextRequest,
 {params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size)
  return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,4096);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>saveTeamAssignmentRevision(db,
   {accountId:actor.id,role:"admin"},id,body));
  if(result.ok)return jsonResult(result,201);
  return jsonResult({error:result.error},
   result.error==="invalid-input"?400:
   result.error==="not-found"||result.error==="assignment-not-active"?404:409);
 }catch(error){
  if(error instanceof Error&&
   ["team-access-forbidden","team-context-unavailable","team-id-invalid",
    "team-context-not-ready"].includes(error.message))
    return jsonResult({error:"not-found"},404);
  if((error as {code?:unknown})?.code==="23505")
   return jsonResult({error:"conflict"},409);
  console.error("team-member-assignment-update-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
