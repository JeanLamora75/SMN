import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readScopedTeamAbsences} from "@/server/members/team-absence-read";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",{type:"members",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)return jsonResult({error:"context-not-ready"},503);
 const q=request.nextUrl.searchParams;
 if([...q.keys()].some(k=>k!=="teamId")||q.getAll("teamId").length!==1)
  return jsonResult({error:"invalid-input"},400);
 const teamId=q.get("teamId");
 if(!teamId)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const data=await withAuthDb(db=>readScopedTeamAbsences(db,
   {accountId:actor.id,role:"admin"},id,teamId));
  const today=new Intl.DateTimeFormat("sv-SE",{
   timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"
  }).format(new Date());
  return jsonResult({...data,today});
 }catch(error){
  if(error instanceof Error&&[
   "member-out-of-team","member-id-invalid","team-context-unavailable",
   "team-id-invalid","team-access-forbidden","team-context-not-ready","member-not-found"
  ].includes(error.message))return jsonResult({error:"not-found"},404);
  return jsonResult({error:"service-unavailable"},503);
 }
}
