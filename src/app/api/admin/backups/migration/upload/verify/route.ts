import {NextRequest} from "next/server";
import {lstat,readFile,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {verifyUploadedPortableBackup,importPortableBackup} from "@/server/backup/portable-import";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const TOKEN=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"backups",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request,4096);
 if(!input||typeof input.token!=="string"||!TOKEN.test(input.token)||
  typeof input.phrase!=="string"||input.phrase.length<20||
  input.phrase.length>256||Object.keys(input).some(k=>!["token","phrase"].includes(k)))
  return jsonResult({error:"migration-verification-invalid"},400);
 const dir=join(process.cwd(),"data","migration-inbox");
 const token=input.token;
 const tar=join(dir,token+".tar.gz");
 const indexPath=join(dir,token+".json");
 try{
  const stat=await lstat(tar);
  if(!stat.isFile()||stat.isSymbolicLink())
   throw Error("migration-upload-file-invalid");
  const meta=JSON.parse(await readFile(indexPath,"utf8")) as {
   archiveId?:string;hasTransferEvidence?:boolean
  };
  const result=await verifyUploadedPortableBackup(tar,input.phrase,
   meta.hasTransferEvidence===true?{
    receiptPath:tar+".receipt.json",ledgerPath:tar+".privacy.enc"
   }:undefined);
  if(meta.archiveId!==result.archiveId)
   throw Error("migration-upload-identity-mismatch");
  if(result.sourceEvidenceVerified){
   const target=join(process.cwd(),"data","migration-work",token);
   const imported=await importPortableBackup(tar,result.archiveId,input.phrase,target);
   if(imported.archiveId!==result.archiveId)
    throw Error("migration-imported-archive-id-differ");
   await writeFile(join(dir,token+".verified.json"),JSON.stringify({
    version:1,archiveId:result.archiveId,sourceEvidenceVerified:true,
    checkedAt:new Date().toISOString()
   }),{flag:"wx",mode:0o600});
  }
  return jsonResult({...result,state:"verified-no-activation",
   nextStep:"offline-cutover-not-yet-automated"},200);
 }catch(error){
  // Isolated CI fixture only: report a constant machine-safe reason, never
  // the recovery phrase, raw file contents or an arbitrary stack trace.
  if(process.env.GITHUB_ACTIONS==="true"&&
   process.env.SMN442_E2E_DISPOSABLE==="YES"){
   const reason=error instanceof Error&&
    /^(?:migration|portable|backup|erasure|configuration)-[a-z0-9-]+$/.test(error.message)?
    error.message:"migration-unexpected-error";
   console.error("SMN442 isolated verification:",reason);
  }
  return jsonResult({error:"migration-verification-refused",
   restorationAuthorized:false},422);
 }
}
