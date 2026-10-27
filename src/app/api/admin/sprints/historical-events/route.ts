import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createHistoricalEvent} from "@/server/sprints/historical-events";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const data=await readJsonObject(req);
 if(!data)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>createHistoricalEvent(db,actor.id,data));
 return jsonResult(result,result.ok?201:result.error==="invalid-input"?400:409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
