import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {backupRootPath,backupState,createManualBackup} from "@/server/backup/runner";
import {backupInventory} from "@/server/backup/verification";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"backups",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{
  const state=await backupState();
  return jsonResult({...state,inventory:await backupInventory(backupRootPath())});
 }
 catch{return jsonResult({error:"backup-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body||Object.keys(body).some(k=>k!=="recoveryPhrase")||
 (body.recoveryPhrase!==undefined&&typeof body.recoveryPhrase!=="string"))
  return jsonResult({status:"failed",error:"invalid-input"},400);
 try{
  const result=await createManualBackup(actor,body.recoveryPhrase as string|undefined);
  return jsonResult(result,201);
 }catch{
  console.error("smn-backup-attempt-failed");
  return jsonResult({status:"failed",error:"backup-failed"},503);
 }
}
