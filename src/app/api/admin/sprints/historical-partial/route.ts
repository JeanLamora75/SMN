import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {saveHistoricalPartial} from "@/server/sprints/historical-partial";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>saveHistoricalPartial(db,actor.id,body));
 return jsonResult(result,result.ok?201:result.error==="invalid-input"?400:409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
