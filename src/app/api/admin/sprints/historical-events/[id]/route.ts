import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {correctHistoricalEvent} from "@/server/sprints/historical-events";
export const dynamic="force-dynamic";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const result=await withLegacyTeamApi(db=>correctHistoricalEvent(db,actor.id,id,body));
 return jsonResult(result,result.ok?200:result.error==="invalid-input"?400:result.error==="not-found"?404:409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
