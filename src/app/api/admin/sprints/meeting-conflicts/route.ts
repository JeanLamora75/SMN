import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readMeetingConflicts} from "@/server/sprints/meeting-conflicts";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withLegacyTeamApi(readMeetingConflicts));}
 catch{return jsonResult({error:"unavailable"},503);}
}
