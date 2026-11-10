import {NextRequest} from "next/server";
import {readFile,writeFile,lstat,rename} from "node:fs/promises";
import path from "node:path";
import {authorizeApi} from "@/server/auth/authorization";
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
  const record={id:preview.id,nonce:preview.nonce,version:preview.toVersion,
    actor:actor.id,approvedAt:new Date().toISOString()};
  await writeFile(pending,JSON.stringify(record)+"\n",{flag:"wx",mode:0o600});
  return jsonResult({accepted:true,version:preview.toVersion,notice:"update-awaiting-launcher"},202);
 }catch{
  console.error("smn-update-confirmation-failed");
  return jsonResult({error:"update-preflight-failed"},409);
 }
}
