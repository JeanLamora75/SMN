import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {readScopedCeremonyOutcomes} from "@/server/teams/ceremony-outcomes-read";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)return jsonResult({error:"context-not-ready"},503);
 const q=req.nextUrl.searchParams;
 if(q.size!==3||["teamId","kind","id"].some(k=>q.getAll(k).length!==1))return jsonResult({error:"invalid-input"},400);
 const teamId=q.get("teamId"),kind=q.get("kind"),id=q.get("id");
 if(!teamId||!kind||!id)return jsonResult({error:"invalid-input"},400);
 try{
  const outcomes=await withAuthDb(db=>readScopedCeremonyOutcomes(db,{accountId:actor.id,role:"admin"},teamId,kind,id));
  return outcomes===null?jsonResult({error:"not-found"},404):jsonResult({outcomes});
 }catch{return jsonResult({error:"service-unavailable"},503);}
}