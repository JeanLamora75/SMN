import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {authorizeRegistryRecord} from "@/server/registries/scoped-record";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readRiskAssessment,saveRiskAssessment} from "@/server/registries/assessment";
export const dynamic="force-dynamic";export const runtime="nodejs";
const target={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const data=await withSprintIndexDb(async db=>{
   const teamId=await authorizeRegistryRecord(db,{accountId:actor.id,role:actor.role},id);
   if(!teamId)return null;
   return readRiskAssessment(db,id);
  });
  return jsonResult(data??{error:"not-found"},data?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const b=await readJsonObject(req);
 if(!b)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(async db=>{
   const teamId=await authorizeRegistryRecord(db,{accountId:actor.id,role:actor.role},id);
   if(!teamId)return {ok:false as const,error:"not-found" as const};
   return saveRiskAssessment(db,actor.id,id,b,{actor:{accountId:actor.id,role:actor.role},teamId:teamId!});
  });
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
