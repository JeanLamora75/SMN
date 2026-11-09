import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {previewBackup} from "@/server/backup/preview";
import {assessRestoreGate} from "@/server/backup/restore-readiness";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Deliberately read-only: no pg_restore, no filesystem cutover, no session mutation. */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"backups",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const payload=await readJsonObject(request);
 if(!payload||Object.keys(payload).length!==1||typeof payload.id!=="string"||
  !uuid.test(payload.id))return jsonResult({error:"invalid-input"},400);
 try{
  const preview=await previewBackup(payload.id);
  return jsonResult({preview,gate:assessRestoreGate(preview)},409);
 }catch{return jsonResult({error:"restore-preflight-unavailable"},503);}
}
