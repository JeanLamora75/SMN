import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {changeManualAiResponse} from "@/server/ai-briefs/responses";
export const dynamic="force-dynamic";
async function change(req:NextRequest,params:Promise<{id:string;responseId:string}>,action:"update"|"delete"){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id,responseId}=await params;
 const raw=action==="update"?await readJsonObject(req,300000):null;
 if(action==="update"&&!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(async db=>{
   const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
   if(teams.rows.length!==1)return {ok:false as const,error:"not-found"};
   return changeManualAiResponse(db,id,teams.rows[0].id,responseId,action,raw);
  });
  return jsonResult(result,result.ok?200:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string;responseId:string}>}){return change(req,params,"update");}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string;responseId:string}>}){return change(req,params,"delete");}
