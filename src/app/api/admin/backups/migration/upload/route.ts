import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {open,mkdir,lstat,rename,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {extractSmnEncryptedZip} from "@/server/backup/portable-zip-reader";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const LIMIT=2*1024*1024*1024;
const root=()=>join(process.cwd(),"data","migration-inbox");
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"backups",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const size=Number(request.headers.get("content-length"));
 if(request.headers.get("content-type")!=="application/zip"||
  !Number.isSafeInteger(size)||size<150||size>LIMIT||!request.body)
  return jsonResult({error:"migration-invalid-file"},400);
 const dir=root(),token=randomUUID();
 const partial=join(dir,token+".partial");
 const zip=join(dir,token+".zip");
 const tar=join(dir,token+".tar.gz");
 let written=0;
 try{
  await mkdir(dir,{recursive:true,mode:0o700});
  const stat=await lstat(dir);
  if(!stat.isDirectory()||stat.isSymbolicLink())
   throw Error("migration-untrusted-directory");
  const handle=await open(partial,"wx",0o600);
  try{
   const reader=request.body.getReader();
   while(true){
    const chunk=await reader.read();
    if(chunk.done)break;
    written+=chunk.value.length;
    if(written>LIMIT||written>size)
     throw Error("migration-upload-over-limit");
    await handle.writeFile(chunk.value);
   }
   if(written!==size)throw Error("migration-upload-length-mismatch");
   await handle.sync();
  }finally{await handle.close();}
  await rename(partial,zip);
  const result=await extractSmnEncryptedZip(zip,tar);
  await rm(zip,{force:true});
  await writeFile(join(dir,token+".json"),JSON.stringify({
   version:1,archiveId:result.archiveId,encryptedBytes:result.size,
   hasTransferEvidence:result.hasTransferEvidence,
   receivedAt:new Date().toISOString(),state:"awaiting-verification"
  }),{flag:"wx",mode:0o600});
  return jsonResult({state:"received",token,archiveId:result.archiveId,
   hasTransferEvidence:result.hasTransferEvidence,
   verified:false,restorationAuthorized:false},201);
 }catch{
  await rm(partial,{force:true}).catch(()=>undefined);
  await rm(zip,{force:true}).catch(()=>undefined);
  await rm(tar,{force:true}).catch(()=>undefined);
  await rm(tar+".receipt.json",{force:true}).catch(()=>undefined);
  await rm(tar+".privacy.enc",{force:true}).catch(()=>undefined);
  return jsonResult({error:"migration-upload-refused"},422);
 }
}
