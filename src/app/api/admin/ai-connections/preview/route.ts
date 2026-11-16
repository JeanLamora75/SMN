import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSessionReadDb} from "@/server/auth/database";
import {SESSION_COOKIE} from "@/server/auth/guards";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {validAiDeliveryInput,previewAiDelivery} from "@/server/ai-connections/delivery";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req,1024);
 if(!validAiDeliveryInput(input)||input.approval!==undefined)
  return jsonResult({error:"invalid-input"},400);
 const sessionToken=req.cookies.get(SESSION_COOKIE)?.value;
 if(!sessionToken)return jsonResult({error:"forbidden"},403);
 try{
  const result=await withSessionReadDb(db=>previewAiDelivery(db,{
   accountId:actor.id,sessionToken,archiveId:input.archiveId,connectionId:input.connectionId
  }));
  return jsonResult(result,result.ok?200:result.error==="integrity-error"?409:422);
 }catch{return jsonResult({error:"unavailable"},503);}
}
