import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {writeHistoricalActualCapacity} from "@/server/sprints/historical-actual-capacity";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>writeHistoricalActualCapacity(db,actor.id,raw));
  return jsonResult(result,result.ok?200:result.error==="invalid-input"?400:409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
