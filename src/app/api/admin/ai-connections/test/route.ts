import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {testAiConnection} from "@/server/ai-connections/connection-test";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,512);
 if(!body||typeof body.id!=="string"||!Number.isSafeInteger(body.revision))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>testAiConnection(db,body.id as string,body.revision as number));
  return jsonResult(result,result.ok?200:result.error==="conflict-or-not-found"?409:422);
 }catch{return jsonResult({error:"unavailable"},503);}
}
