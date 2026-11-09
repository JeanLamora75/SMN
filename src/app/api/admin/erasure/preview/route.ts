import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {listErasureTargets,previewMemberErasure} from "@/server/backup/erasure-preview";
import {issueImpactReceipt} from "@/server/backup/erasure-plan-token";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"backups",exists:true,inScope:true} as const;

export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({targets:await listErasureTargets()});}
 catch{return jsonResult({error:"targets-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body||Object.keys(body).some(k=>k!=="memberId"&&k!=="mode")||
  Object.keys(body).length!==2||typeof body.memberId!=="string"||
  !/^[a-zA-Z0-9_-]{1,120}$/.test(body.memberId)||
  (body.mode!=="erase"&&body.mode!=="anonymize"))
  return jsonResult({error:"invalid-input"},400);
 try{
  const preview=await previewMemberErasure(body.memberId,body.mode);
  const issued=preview.scopeRevision?issueImpactReceipt({
   actorId:actor.id,memberId:preview.memberId,mode:preview.mode,
   scopeRevision:preview.scopeRevision
  }):null;
  return jsonResult({...preview,plan:issued?{
   planId:issued.receipt.planId,token:issued.token,expiresAt:issued.receipt.expiresAt,
   executionPermitted:false
  }:null});
 }
 catch{return jsonResult({error:"impact-unavailable"},503);}
}
