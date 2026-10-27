import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readSprintTrends} from "@/server/sprints/trends";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const sprintId=req.nextUrl.searchParams.get("sprintId");
 if(!sprintId||!/^[0-9a-f-]{36}$/i.test(sprintId))return jsonResult({error:"invalid-input"},400);
 try{const points=await withLegacyTeamApi(db=>readSprintTrends(db,sprintId));return jsonResult(points===null?{error:"not-found"}:{points},points===null?404:200);}
 catch{return jsonResult({error:"unavailable"},503);}
}
