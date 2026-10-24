import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {readBriefDraft,updateBriefDraft} from "@/server/ai-briefs/duplicates";
export const dynamic="force-dynamic";
const scope={type:"settings",exists:true,inScope:true} as const;
async function scoped<T>(operation:(db:import("pg").Client,teamId:string)=>Promise<T>){
 return withAuthDb(async db=>{
  const result=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
  if(result.rows.length!==1)return null;
  return operation(db,result.rows[0].id);
 });
}
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"write",scope))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const result=await scoped((db,teamId)=>readBriefDraft(db,id,teamId));return jsonResult(result??{error:"not-found"},result?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 if(!await authorizeApi(req,"write",scope))return jsonResult({error:"forbidden"},403);
 const payload=await readJsonObject(req,250000);const {id}=await params;
 if(!payload||typeof payload.content!=="string"||typeof payload.revision!=="number")return jsonResult({error:"invalid-input"},400);
 try{const result=await scoped((db,teamId)=>updateBriefDraft(db,id,teamId,payload.revision as number,payload.content as string));
 return jsonResult(result??{error:"not-found"},result?.ok?200:result?.error==="conflict"?409:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
