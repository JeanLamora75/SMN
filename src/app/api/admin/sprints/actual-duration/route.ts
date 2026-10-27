import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {listActualDurations,updateActualDuration} from "@/server/sprints/actual-duration";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({events:await withLegacyTeamApi(listActualDurations)});}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>updateActualDuration(db,actor.id,input));
  return jsonResult(result,result.ok?200:result.error==="closed-period"?409:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
