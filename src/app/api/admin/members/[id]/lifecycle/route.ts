import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {applyLifecycleAction,inspectMemberLifecycle} from "@/server/members/lifecycle";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{return jsonResult(await withLegacyMemberApi(db=>inspectMemberLifecycle(db,id)));}
 catch(error){
  if(error instanceof Error&&["member-not-found","member-id-invalid"].includes(error.message))
   return jsonResult({error:"not-found"},404);
  console.error("member-lifecycle-inspection-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyMemberApi(db=>applyLifecycleAction(db,id,actor.id,body));
  if(!result.ok){
   const conflict=["conflict","historical-references","business-data","cascade-risk",
    "assignment-already-closed","already-archived","not-archived","assignment-still-open",
    "future-version"].includes(result.error);
   return jsonResult({error:result.error},result.error==="not-found"||
    result.error==="assignment-not-found"||result.error==="team-unavailable"?404:conflict?409:400);
  }
  return jsonResult(result);
 }catch(error){
  // A FK violation means that some history exists beyond the known reference inventory.
  if(error&&typeof error==="object"&&"code" in error&&(error as {code:unknown}).code==="23503")
   return jsonResult({error:"historical-references"},409);
  console.error("member-lifecycle-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
