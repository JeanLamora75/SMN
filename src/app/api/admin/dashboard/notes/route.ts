import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createDashboardNote} from "@/server/dashboard/notes";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>createDashboardNote(db,actor.id,raw));
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
