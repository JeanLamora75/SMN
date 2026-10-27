import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {exceptionalMeetingHistory} from "@/server/sprints/exceptional-meetings";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest,ctx:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await ctx.params;
 try{return jsonResult({history:await withLegacyTeamApi(db=>exceptionalMeetingHistory(db,id))});}
 catch{return jsonResult({error:"unavailable"},503);}
}
