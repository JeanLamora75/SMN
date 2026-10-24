import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {duplicateBrief} from "@/server/ai-briefs/duplicates";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const payload=await readJsonObject(req);
 if(!payload||typeof payload.parentId!=="string")return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
   if(r.rows.length!==1)return {ok:false as const,error:"not-found"};
   return duplicateBrief(db,payload.parentId as string,r.rows[0].id,actor.id);
  });
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:result.error==="integrity-error"?409:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
