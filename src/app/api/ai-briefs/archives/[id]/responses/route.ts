import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listManualAiResponses,saveManualAiResponse} from "@/server/ai-briefs/responses";
export const dynamic="force-dynamic";
export const runtime="nodejs";
async function teamId(db:import("pg").Client){
 const result=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton'
 AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
 return result.rows.length===1?result.rows[0].id:null;
}
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const result=await withLegacyTeamApi(async db=>{
   const team=await teamId(db);if(!team)return null;
   return listManualAiResponses(db,id,team);
  });
  return jsonResult(result===null?{error:"not-found"}:{responses:result},result===null?404:200);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req,300000);if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withLegacyTeamApi(async db=>{
   const team=await teamId(db);if(!team)return {ok:false as const,error:"not-found"};
   return saveManualAiResponse(db,id,team,actor.id,input);
  });
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:result.error==="integrity-error"||result.error==="already-active"?409:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
