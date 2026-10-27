import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {writeSprintReview} from "@/server/sprints/review-analysis";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;
const MAX_REQUEST_BYTES=16*1024;

/** Stream-bounded JSON request, sufficient for 3000 UTF-8 characters without
 * changing the global 4KB request limit for unrelated admin endpoints. */
async function readReviewJson(req:NextRequest):Promise<Record<string,unknown>|null>{
 if(req.headers.get("content-type")?.split(";")[0].trim()!=="application/json")
  return null;
 const declared=Number(req.headers.get("content-length")||"0");
 if(!Number.isFinite(declared)||declared<0||declared>MAX_REQUEST_BYTES)
  return null;
 const reader=req.body?.getReader();
 if(!reader)return null;
 const parts:Uint8Array[]=[];
 let total=0;
 while(true){
  const {done,value}=await reader.read();
  if(done)break;
  total+=value.byteLength;
  if(total>MAX_REQUEST_BYTES){
   await reader.cancel().catch(()=>undefined);
   return null;
  }
  parts.push(value);
 }
 if(total===0)return null;
 try{
  const body=new TextDecoder("utf-8",{fatal:true}).decode(
   Buffer.concat(parts.map(part=>Buffer.from(part)))
  );
  const parsed:unknown=JSON.parse(body);
  return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?
   parsed as Record<string,unknown>:null;
 }catch{return null;}
}

/** Separate optimistic revisions for human analysis and AI-related commentary. */
export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readReviewJson(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>writeSprintReview(db,actor.id,input));
  return jsonResult(result,result.ok?200:
   result.error==="closed-period"||result.error==="conflict"?409:
   result.error==="not-found"?404:400);
 }catch{
  return jsonResult({error:"unavailable"},503);
 }
}
