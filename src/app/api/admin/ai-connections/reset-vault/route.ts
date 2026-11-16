import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {resetAiVault} from "@/server/ai-connections/recovery";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 if(!await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>resetAiVault(db,body.confirm));
  return jsonResult(result,result.ok?200:result.error==="confirmation-required"?400:503);
 }catch{return jsonResult({error:"unavailable"},503);}
}
