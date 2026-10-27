import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {correctAssignmentStart} from "@/server/members/assignment-start-correction";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"members",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyMemberApi(db=>correctAssignmentStart(db,id,actor.id,body));
  return jsonResult(result,result.ok?200:result.error==="not-found"?404:
    ["conflict","overlap","missing-version"].includes(result.error)?409:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
