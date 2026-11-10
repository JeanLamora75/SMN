import {NextRequest} from "next/server";
import {readFile,writeFile,lstat,rename} from "node:fs/promises";
import path from "node:path";
import {authorizeApi} from "@/server/auth/authorization";
import {backupRootPath} from "@/server/backup/runner";
import {backupInventory} from "@/server/backup/verification";
import {inspectUpdateSchema} from "@/server/updates/schema-preflight";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {isUpdateId,isUpdateNonce,readPreview,runUpdateScript,safeUpdatesRoot} from "@/server/updates/local";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"backups",exists:true,inScope:true} as const;
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(process.platform!=="win32")return jsonResult({error:"update-windows-only"},409);
 const input=await readJsonObject(request);
 if(!input||Object.keys(input).some(k=>!["id","nonce","confirm"].includes(k))||
   !isUpdateId(input.id)||!isUpdateNonce(input.nonce)||input.confirm!==true)
  return jsonResult({error:"update-confirmation-required"},400);
 try{
  const root=await safeUpdatesRoot();
  // Confirm only when the process owner is polling for an update request.
  const owner=JSON.parse(await readFile(path.join(root,"launcher.json"),"utf8")) as {at:string};
  if(!owner.at||Date.now()-Date.parse(owner.at)>12000)
    return jsonResult({error:"update-launcher-not-active"},409);
  const preview=await readPreview(input.id);
  if(preview.actor!==actor.id||preview.nonce!==input.nonce)
   return jsonResult({error:"update-preview-not-owned"},403);
  const pending=path.join(root,"pending.json");
  try{
   const state=await lstat(pending);
   if(state.isFile())return jsonResult({error:"update-already-pending"},409);
   return jsonResult({error:"update-unsafe-pending"},409);
  }catch(e){
   if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;
  }
  // The signed manifest and base are checked *again* immediately before approval.
  await runUpdateScript("verify-staged-update.mjs",[
   "--root",process.cwd(),"--id",preview.id
  ]);
  // A current, complete and cryptographically verified recovery point is mandatory.
  // A cached badge or a last-attempt status is never sufficient evidence.
  const backups=await backupInventory(backupRootPath());
  const verified=backups.find(item=>item.status==="verified" &&
   item.integrityVerified===true && item.scopeComplete===true &&
   item.components.some(component=>component.kind==="database") &&
   item.createdAt!==null && Number.isFinite(Date.parse(item.createdAt)) &&
   Date.now()-Date.parse(item.createdAt)>=0 &&
   Date.now()-Date.parse(item.createdAt)<=24*60*60*1000);
  if(!verified)return jsonResult({error:"update-verified-backup-required"},409);
  // Recheck the live DB after ZIP verification and before the launcher stops the web server.
  // Never infer compatibility from the package version or a prior cached diagnostic.
  let schema;
  try{schema=await inspectUpdateSchema();}
  catch{return jsonResult({error:"update-schema-incompatible"},409);}
  const record={backupId:verified.id,schema, id:preview.id,nonce:preview.nonce,version:preview.toVersion,
    actor:actor.id,approvedAt:new Date().toISOString()};
  await writeFile(pending,JSON.stringify(record)+"\n",{flag:"wx",mode:0o600});
  return jsonResult({accepted:true,version:preview.toVersion,notice:"update-awaiting-launcher"},202);
 }catch{
  console.error("smn-update-confirmation-failed");
  return jsonResult({error:"update-preflight-failed"},409);
 }
}
