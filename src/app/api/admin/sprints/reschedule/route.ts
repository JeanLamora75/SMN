import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {previewReschedule,confirmReschedule} from "@/server/sprints/reschedule";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest){
 if(!await authorizeApi(req,"write",target))return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);if(!input)return jsonResult({error:"invalid-input"},400);
 try{const r=await withAuthDb(db=>previewReschedule(db,input));return jsonResult(r,r.ok?200:409);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);if(!input)return jsonResult({error:"invalid-input"},400);
 try{const r=await withAuthDb(db=>confirmReschedule(db,actor.id,input));return jsonResult(r,r.ok?200:409);}
 catch(error){
  const detail=error instanceof Error?error.message:"unknown";
  console.error("sprint-reschedule-confirm-failed",{
   message:detail,
   code:typeof error==="object"&&error!==null&&"code" in error?String(error.code):undefined
  });
  return jsonResult({error:"unavailable"},503);
 }
}
