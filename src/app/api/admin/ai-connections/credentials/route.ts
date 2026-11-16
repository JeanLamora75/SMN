import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {mutateCredential} from "@/server/ai-connections/credentials";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const scope={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 if(!await authorizeApi(req,"write",scope))return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,12000);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>mutateCredential(db,body));
  return jsonResult(result,result.ok?200:result.error==="conflict-or-not-found"?409:result.error==="invalid-input"?400:503);
 }catch{return jsonResult({error:"unavailable"},503);}
}
