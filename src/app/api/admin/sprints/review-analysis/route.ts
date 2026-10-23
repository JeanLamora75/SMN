import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {writeSprintReview} from "@/server/sprints/review-analysis";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;

/** Separate optimistic revisions for human analysis and AI-related commentary. */
export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>writeSprintReview(db,actor.id,input));
  return jsonResult(result,result.ok?200:
   result.error==="closed-period"||result.error==="conflict"?409:
   result.error==="not-found"?404:400);
 }catch{
  return jsonResult({error:"unavailable"},503);
 }
}
