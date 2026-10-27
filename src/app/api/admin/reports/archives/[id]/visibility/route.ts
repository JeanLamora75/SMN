import {NextRequest} from "next/server";
import {withAuthDb} from "@/server/auth/database";
import {assertTeamPdfArchive} from "@/server/reports/team-archive";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {hidePdfArchive} from "@/server/reports/archive-visibility";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;const input=await readJsonObject(req);
 const reason=input?.reason;
 if(!input||input.action!=="hide"||typeof reason!=="string")return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId");
 if(teamId&&actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 try{const result=teamId?await withAuthDb(async db=>{
  if(!await assertTeamPdfArchive(db,{accountId:actor.id,role:actor.role},teamId,id))return {ok:false as const,error:"not-found"};
  return hidePdfArchive(db,id,actor.id,reason);
 }):await withLegacyTeamApi(db=>hidePdfArchive(db,id,actor.id,reason));
 return jsonResult(result,result.ok?200:result.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
