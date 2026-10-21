import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {backupRootPath} from "@/server/backup/runner";
import {executeBackupRetention,updateBackupRetention} from "@/server/backup/retention";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"backups",exists:true,inScope:true} as const;

export async function PATCH(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>updateBackupRetention(db,actor.id,input));
  if(!result.ok)return jsonResult({error:result.error},result.error==="conflict"?409:
   result.error==="invalid-input"?400:503);
  return jsonResult(result);
 }catch{
  console.error("smn-retention-policy-failed");
  return jsonResult({error:"retention-unavailable"},503);
 }
}

export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input||Object.keys(input).some(k=>!["confirm","revision","ids"].includes(k))||
  input.confirm!==true||!Array.isArray(input.ids)||input.ids.length===0||
  !Number.isSafeInteger(input.revision)||typeof input.revision!=="number"||
  input.revision<0)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>executeBackupRetention(db,backupRootPath(),
   actor.id,input.revision as number,input.ids));
  if(!result.ok)return jsonResult({error:result.error},result.error==="conflict"?409:
   result.error==="invalid-input"?400:503);
  return jsonResult(result);
 }catch{
  console.error("smn-retention-cleanup-failed");
  return jsonResult({error:"retention-unavailable"},503);
 }
}
