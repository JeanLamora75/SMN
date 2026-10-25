import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {reviseRegistryComment} from "@/server/registries/comments";

export const dynamic="force-dynamic";
export const runtime="nodejs";
type Context={params:Promise<{id:string;commentId:string}>};

export async function PATCH(req:NextRequest,{params}:Context){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,16384);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id,commentId}=await params;
 try{
  const result=await withAuthDb(db=>reviseRegistryComment(db,actor.id,id,commentId,"edit",body));
  return jsonResult(result,result.ok?200:
   result.error==="conflict"?409:result.error==="withdrawn"?409:
   result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
/** HTTP DELETE marks withdrawn_at only. No physical SQL DELETE is performed. */
export async function DELETE(req:NextRequest,{params}:Context){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,16384);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id,commentId}=await params;
 try{
  const result=await withAuthDb(db=>reviseRegistryComment(db,actor.id,id,commentId,"withdraw",body));
  return jsonResult(result,result.ok?200:
   result.error==="conflict"?409:result.error==="withdrawn"?409:
   result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
