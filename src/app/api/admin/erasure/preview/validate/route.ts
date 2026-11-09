import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {verifyImpactReceipt} from "@/server/backup/erasure-plan-token";
import {previewMemberErasure} from "@/server/backup/erasure-preview";
export const runtime="nodejs";
export const dynamic="force-dynamic";

/**
 * SMN-38: revalidate a server-signed preview on current database and files.
 * This endpoint cannot commit, anonymize, erase or approve an execution.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{
  type:"backups",exists:true,inScope:true
 });
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,2048);
 if(!body||Object.keys(body).length!==1||typeof body.token!=="string"||
  body.token.length>1500)return jsonResult({error:"invalid-input"},400);
 const receipt=verifyImpactReceipt(body.token,actor.id);
 if(!receipt)return jsonResult({status:"invalid-or-expired",executionPermitted:false},409);
 try{
  const current=await previewMemberErasure(receipt.memberId,receipt.mode);
  const stable=current.scopeRevision!==null&&
   current.scopeRevision===receipt.scopeRevision;
  return jsonResult({
   status:stable?"unchanged":"stale-or-unverifiable",
   capturedAt:current.capturedAt,planId:receipt.planId,
   expiresAt:receipt.expiresAt,revisionVerified:stable,
   analysisComplete:current.complete,executionPermitted:false,
   reason:stable?"no-verified-change":"scope-changed-or-incomplete"
  },stable?200:409);
 }catch{return jsonResult({status:"unverifiable",executionPermitted:false},503);}
}
