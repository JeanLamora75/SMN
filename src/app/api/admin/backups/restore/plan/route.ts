import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {previewBackup} from "@/server/backup/preview";
import {assessRestoreGate} from "@/server/backup/restore-readiness";
import {currentErasureEvidence} from "@/server/backup/erasure-protection";
import {withSessionReadDb} from "@/server/auth/database";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Single-step restore preparation. The browser supplies ONLY an archive id.
 * All privacy evidence, integrity checks and blockers are computed server-side.
 * Never restores PostgreSQL, touches documents or issues an activation token.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"backups",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body||Object.keys(body).length!==1||
  typeof body.id!=="string"||!uuid.test(body.id))
  return jsonResult({error:"invalid-input"},400);
 try{
  const preview=await previewBackup(body.id);
  const evidence=await withSessionReadDb(db=>
   currentErasureEvidence(preview.archive.createdAt??undefined,db));
  const gate=assessRestoreGate(preview,evidence);
  // A green archive integrity check cannot grant production restoration.
  return jsonResult({mode:"read-only-restore-plan",preview,gate,
   privacyHistoryComplete:evidence.state==="verified"&&evidence.completeHistory===true,
   canExecute:false,activeInstallationModified:false},409);
 }catch{
  return jsonResult({error:"restore-plan-unavailable"},503);
 }
}
