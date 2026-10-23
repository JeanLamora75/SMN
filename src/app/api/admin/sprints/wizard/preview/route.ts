import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {previewWizard} from "@/server/sprints/wizard";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>previewWizard(db,actor.id,input));
  return jsonResult(result,result.ok?200:400);
 }catch(error){
  console.error("sprint-wizard-preview-failed");
  return jsonResult({error:"preview-unavailable"},503);
 }
}
