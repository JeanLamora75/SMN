import {NextRequest} from "next/server";
import {revalidatePath} from "next/cache";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {saveMemberAbsence} from "@/server/members/absence";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

/** Les absences appartiennent à la personne : POST n'est autorisé en v28
 * que si les plages ancienne et nouvelle relèvent exclusivement de teamId.
 * Le verrou global empêche toute exécution avant la recette multiéquipes.
 */
export async function POST(request:NextRequest,
 {params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")
  return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 if(request.nextUrl.searchParams.size!==0)
  return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(request,4096);
 if(!body||Object.keys(body).length!==2||
    typeof body.teamId!=="string"||!Object.hasOwn(body,"change"))
  return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>saveMemberAbsence(
   db,id,actor.id,body.change,
   {actor:{accountId:actor.id,role:"admin"},teamId:body.teamId as string}
  ));
  if(!result.ok)return jsonResult({error:result.error},
   ["not-found","team-unavailable"].includes(result.error)?404:
   ["conflict","overlap","archived","category-inactive"].includes(result.error)?409:400);
  revalidatePath("/app/admin/members");
  revalidatePath("/app/team-calendar");
  revalidatePath("/app");
  return jsonResult({...result,capacityRefresh:"on-demand"},result.created?201:200);
 }catch(error){
  if(error instanceof Error&&[
   "team-context-unavailable","team-id-invalid","team-access-forbidden",
   "team-context-not-ready"
  ].includes(error.message))return jsonResult({error:"not-found"},404);
  if((error as {code?:unknown})?.code==="23505")
   return jsonResult({error:"conflict"},409);
  console.error("team-member-absence-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
