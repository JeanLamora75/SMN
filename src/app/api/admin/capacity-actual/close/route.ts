import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {closeActualCapacity} from "@/server/capacity/actual";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const r=await withLegacyTeamApi(db=>closeActualCapacity(db,actor.id,body));
  if(!r.ok)return jsonResult({error:r.error},
   r.error==="not-finished"?409:r.error==="conflict"?409:
   r.error==="team-unavailable"?503:400);
  return jsonResult(r);
 }catch{console.error("actual-capacity-close-failed");return jsonResult({error:"service-unavailable"},503);}
}
