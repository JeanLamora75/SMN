import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {backupRootPath,backupState,createManualBackup} from "@/server/backup/runner";
import {backupInventory} from "@/server/backup/verification";
import {withAuthDb} from "@/server/auth/database";
import {readBackupRetention,expiredManagedBackups} from "@/server/backup/retention";
import {readProtectionDiagnostics} from "@/server/backup/protection-diagnostics";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"backups",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{
  const state=await backupState();
  const {policy,diagnostics}=await withAuthDb(async db=>({
   policy:await readBackupRetention(db),
   diagnostics:await readProtectionDiagnostics(db)
  }));
  const inventory=await backupInventory(backupRootPath());
  const eligible=expiredManagedBackups(inventory,policy.days);
  const recorded=diagnostics.operations.find(x=>x.kind==="backup");
  // The public last-result badge must reflect fresh evidence rather than
  // trusting last-attempt.json, which may survive an interrupted process.
  const last=state.last&&recorded?{
   ...state.last,status:recorded.status==="succeeded"?"success":
    recorded.status==="running"?"running":
    recorded.status==="interrupted"?"interrupted":
    recorded.status==="cancelled"?"cancelled":"failed"
  }:state.last?.status==="success"?{
   ...state.last,status:"unverifiable"
  }:state.last;
  return jsonResult({...state,last,inventory,
   retention:{...policy,eligibleIds:eligible.map(x=>x.id)}});
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
