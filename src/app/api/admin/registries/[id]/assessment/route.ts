import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readRiskAssessment,saveRiskAssessment} from "@/server/registries/assessment";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const data=await withSprintIndexDb(db=>readRiskAssessment(db,id));
  return jsonResult(data??{error:"not-found"},data?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const data=await withAuthDb(db=>saveRiskAssessment(db,actor.id,id,body));
  return jsonResult(data,data.ok?200:data.error==="conflict"?409:data.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
