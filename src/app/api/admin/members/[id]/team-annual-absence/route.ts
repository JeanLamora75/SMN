import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readTeamAnnualAbsence} from "@/server/members/team-annual-absence";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",{type:"members",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const q=request.nextUrl.searchParams;
 const rawYear=q.get("year");
 if(q.size!==2||q.getAll("teamId").length!==1||q.getAll("year").length!==1||
  !rawYear||!/^\d{4}$/.test(rawYear))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>readTeamAnnualAbsence(db,
   {accountId:actor.id,role:"admin"},id,q.get("teamId")??"",Number(rawYear)));
  return jsonResult(result);
 }catch(e){
  if(e instanceof Error&&e.message==="team-annual-absence-invalid-input")
   return jsonResult({error:"invalid-input"},400);
  if(e instanceof Error&&["member-out-of-team","team-context-unavailable",
   "team-id-invalid","team-access-forbidden"].includes(e.message))
   return jsonResult({error:"not-found"},404);
  console.error("team-annual-absence-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
