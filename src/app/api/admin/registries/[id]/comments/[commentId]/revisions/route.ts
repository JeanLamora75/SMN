import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {jsonResult} from "@/server/auth/request";
import {readCommentRevisions} from "@/server/registries/comments";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(req:NextRequest,{params}:{
 params:Promise<{id:string;commentId:string}>
}){
 const actor=await authorizeApi(req,"read",{type:"audit",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id,commentId}=await params;
 try{
  const result=await withSprintIndexDb(db=>readCommentRevisions(db,id,commentId));
  return jsonResult(result??{error:"not-found"},result?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
