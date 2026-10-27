import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {sprintProposal,createSprint} from "@/server/sprints/creation";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 const startOn=req.nextUrl.searchParams.get("startOn")??undefined;
 try{return jsonResult(await withLegacyTeamApi(db=>sprintProposal(db,startOn)));}
 catch{return jsonResult({error:"invalid-or-unavailable"},400);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>createSprint(db,actor.id,input));
  if(!result.ok)return jsonResult({error:result.error},result.error==="overlap"?409:400);
  return jsonResult({sprint:result.sprint},201);
 }catch{return jsonResult({error:"invalid-or-unavailable"},400);}
}
