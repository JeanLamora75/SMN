import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listBriefTemplates,manageBriefTemplate} from "@/server/ai-briefs/templates";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const scope={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"write",scope))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({templates:await withAuthDb(listBriefTemplates)});}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",scope);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const data=await readJsonObject(req);
 if(!data)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>manageBriefTemplate(db,actor.id,data));
  const status=result.ok?200:result.error==="protected"?403:result.error==="not-found"?404:result.error==="conflict"?409:400;
  return jsonResult(result,status);
 }catch{return jsonResult({error:"unavailable"},503);}
}
