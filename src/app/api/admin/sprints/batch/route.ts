import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {confirmBatch,batchHistory} from "@/server/sprints/batch-confirm";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {teamId,...payload}=input;
 if(teamId!==undefined&&typeof teamId!=="string")return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>confirmBatch(db,actor.id,payload,typeof teamId==="string"?teamId:null));
  return result.ok?jsonResult(result,201):jsonResult(result,result.error==="invalid-input"?400:409);
 }catch{return jsonResult({error:"batch-failed"},503);}
}
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{return jsonResult({history:await withAuthDb(db=>batchHistory(db,actor.id,request.nextUrl.searchParams.get("teamId")))});}
 catch{return jsonResult({error:"history-unavailable"},503);}
}
