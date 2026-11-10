import {NextRequest} from "next/server";
import {readFile,lstat} from "node:fs/promises";
import path from "node:path";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {safeUpdatesRoot,stageUpdateArchive} from "@/server/updates/local";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"backups",exists:true,inScope:true} as const;
async function isAdmin(request:NextRequest,action:"read"|"write"){
 const actor=await authorizeApi(request,action,target);
 return actor?.role==="admin"?actor:null;
}
export async function GET(request:NextRequest){
 const actor=await isAdmin(request,"read");
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{
  const root=process.cwd(),version=JSON.parse(
   await readFile(path.join(root,"distribution-version.json"),"utf8")) as {version:string};
  let trust=false;
  try{
   const info=await lstat(path.join(root,"runtime","trust","update-signing-public.pem"));
   trust=info.isFile()&&!info.isSymbolicLink();
  }catch{}
  let status:null|Record<string,unknown>=null;
  const updates=await safeUpdatesRoot();
  try{
   const raw=JSON.parse(await readFile(path.join(updates,"status.json"),"utf8"));
   if(raw&&typeof raw==="object" && typeof raw.state==="string")
    status={state:raw.state,at:raw.at,version:raw.version};
  }catch{}
  let launcher=false;
  try{
   const live=JSON.parse(await readFile(path.join(updates,"launcher.json"),"utf8")) as {at?:string};
   launcher=typeof live.at==="string"&&Date.now()-Date.parse(live.at)<12000;
  }catch{}
  return jsonResult({version:version.version,ready:trust,launcher,status});
 }catch{return jsonResult({error:"update-distribution-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await isAdmin(request,"write");
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(process.platform!=="win32")return jsonResult({error:"update-windows-only"},409);
 const length=Number(request.headers.get("content-length")??"0");
 if(!Number.isFinite(length)||length>125*1024*1024)
  return jsonResult({error:"update-upload-too-large"},413);
 if(!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data"))
  return jsonResult({error:"update-invalid-type"},415);
 try{
  const body=await request.formData();
  const upload=body.get("file");
  if(!upload||typeof upload==="string" ||typeof upload.arrayBuffer!=="function" ||
    upload.size>120*1024*1024 || upload.size<100 ||
    !upload.name.toLowerCase().endsWith(".zip"))
   return jsonResult({error:"update-file-invalid"},400);
  const preview=await stageUpdateArchive(Buffer.from(await upload.arrayBuffer()),actor.id);
  return jsonResult({preview},201);
 }catch{
  console.error("smn-update-preview-failed");
  return jsonResult({error:"update-untrusted-or-incompatible"},422);
 }
}
