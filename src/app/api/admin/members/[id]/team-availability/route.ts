import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readTeamAvailabilityWindow} from "@/server/members/team-availability-window";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

/** Dedicated read-only v28 endpoint. The old personal absence API remains
 * disabled in v28 until its history/mutations can be fully isolated.
 */
export async function GET(request:NextRequest,
 {params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const query=request.nextUrl.searchParams;
 if(query.size!==3||["teamId","startOn","endOn"].some(k=>query.getAll(k).length!==1))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>readTeamAvailabilityWindow(db,
   {accountId:actor.id,role:actor.role},
   {memberId:id,teamId:query.get("teamId"),
    startOn:query.get("startOn"),endOn:query.get("endOn")}));
  return jsonResult(result);
 }catch(error){
  if(error instanceof Error&&error.message==="team-availability-invalid-input")
   return jsonResult({error:"invalid-input"},400);
  if(error instanceof Error&&[
   "member-out-of-team","team-context-unavailable","team-id-invalid",
   "team-access-forbidden"
  ].includes(error.message))
   return jsonResult({error:"not-found"},404);
  console.error("team-availability-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
