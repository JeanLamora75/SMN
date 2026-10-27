import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createKanbanMeeting} from "@/server/kanban/meetings";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>createKanbanMeeting(db,actor.id,input));
  return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:result.error==="closed-period"?409:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
