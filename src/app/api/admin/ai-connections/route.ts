import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {listAiConnections,mutateAiConnection} from "@/server/ai-connections/registry";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const scope={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"write",scope))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({connections:await withAuthDb(listAiConnections)});}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 if(!await authorizeApi(req,"write",scope))return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,4096);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>mutateAiConnection(db,body));
  return jsonResult(result,result.ok?200:result.error==="conflict-or-not-found"?409:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
