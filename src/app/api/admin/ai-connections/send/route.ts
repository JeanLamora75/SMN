import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {SESSION_COOKIE} from "@/server/auth/guards";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {validAiDeliveryInput,sendAiDelivery} from "@/server/ai-connections/delivery";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req,8192);
 if(!validAiDeliveryInput(input)||typeof input.approval!=="string"||!input.approval)
  return jsonResult({error:"invalid-input"},400);
 const sessionToken=req.cookies.get(SESSION_COOKIE)?.value;
 if(!sessionToken)return jsonResult({error:"forbidden"},403);
 try{
  const result=await withAuthDb(db=>sendAiDelivery(db,{
   accountId:actor.id,sessionToken,archiveId:input.archiveId,connectionId:input.connectionId
  },input.approval));
  return jsonResult(result,result.ok?200:result.error==="approval-expired-or-reused"?409:
   result.error==="provider-rate-limit"||result.error==="local-quota-exhausted"?429:
   result.error==="connection-unavailable"||result.error==="credential-unavailable"?422:503);
 }catch{return jsonResult({error:"unavailable"},503);}
}
