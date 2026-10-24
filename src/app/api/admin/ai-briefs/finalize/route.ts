import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {allowMutation,jsonResult,readJsonObject} from "@/server/auth/request";
import {finalizeAiBrief} from "@/server/ai-briefs/archive";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!allowMutation(req))return jsonResult({error:"invalid-origin"},403);
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const payload=await readJsonObject(req,250000);
 if(!payload)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>finalizeAiBrief(db,actor.id,payload));
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:400);
 }catch{
  return jsonResult({error:"archive-failed",message:"Archive non créée : transaction annulée."},503);
 }
}
