import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {openCapacityPeriod} from "@/server/capacity/opening";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>openCapacityPeriod(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},
   result.error==="conflict"?409:result.error==="team-unavailable"?503:400);
  return jsonResult(result);
 }catch{
  console.error("capacity-opening-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
