import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {previewDeletion,confirmDeletion} from "@/server/sprints/deletion";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>previewDeletion(db,input));
  return jsonResult(result,result.ok?200:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function DELETE(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>confirmDeletion(db,actor.id,input));
  return jsonResult(result,result.ok?200:409);
 }catch{return jsonResult({error:"unavailable"},503);}
}
