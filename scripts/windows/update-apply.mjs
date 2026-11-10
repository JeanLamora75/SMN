// Executed by the portable Windows launcher AFTER the web server has stopped.
// Only update application files: PostgreSQL, runtime, updates and data are never touched.
import {spawnSync} from "node:child_process";
import {readFile,writeFile,mkdir,cp,rename,rm,lstat,readdir} from "node:fs/promises";
import {randomUUID,createHash} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {enumerateUpdateableFiles,verifySignedManifest,
  requireCompatibleBase,verifyUpdatePayload} from "./update-contract.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const updates=path.join(root,"updates");
const pending=path.join(updates,"pending.json");
const ROOTS=["app","prisma","scripts"];
const FILES=["launch-portable.mjs","Demarrer SMN.cmd","Recuperer admin SMN.cmd","distribution-version.json"];
const NAMES=[...ROOTS,...FILES];
async function status(state,version){
 const tmp=path.join(updates,"status-"+randomUUID()+".tmp");
 await writeFile(tmp,JSON.stringify({state,version,at:new Date().toISOString()})+"\n",{flag:"wx"});
 await rename(tmp,path.join(updates,"status.json"));
}
function safeId(id){return typeof id==="string"&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(id);}
async function maybeCopy(src,dst){
 try{const st=await lstat(src);if(st.isSymbolicLink())throw Error("update-target-symlink");
  await cp(src,dst,{recursive:st.isDirectory(),force:false,errorOnExist:true});
 }catch(e){if(e?.code!=="ENOENT")throw e;}
}
async function verifyStage(id){
 const script=path.join(root,"scripts","windows","verify-staged-update.mjs");
 const child=spawnSync(process.execPath,[script,"--root",root,"--id",id],{
  cwd:root,windowsHide:true,stdio:"ignore",timeout:180000});
 if(child.status!==0)throw Error("update-reverification-failed");
}
async function run(){
 if(process.platform!=="win32")throw Error("update-windows-only");
 for(const name of ["data","runtime","updates"]){
  const st=await lstat(path.join(root,name));
  if(!st.isDirectory()||st.isSymbolicLink())throw Error("update-protected-root-unsafe");
 }
 const approval=JSON.parse(await readFile(pending,"utf8"));
 if(!safeId(approval.id)||typeof approval.nonce!=="string"||
    !/^[a-f0-9]{48}$/.test(approval.nonce) ||
    Date.now()-Date.parse(approval.approvedAt)>5*60*1000)
   throw Error("update-approval-expired");
 const stage=path.join(updates,"staging",approval.id);
 const preview=JSON.parse(await readFile(path.join(stage,"preview.json"),"utf8"));
 if(preview.id!==approval.id || approval.nonce!==preview.nonce ||
    approval.version!==preview.toVersion)
   throw Error("update-approval-invalid");
 await verifyStage(approval.id);
 const extracted=path.join(stage,"extracted");
 const manifestBytes=await readFile(path.join(extracted,"manifest.json"));
 const manifest=verifySignedManifest(manifestBytes,
  Buffer.from((await readFile(path.join(extracted,"manifest.sig"),"utf8")).trim(),"base64"),
  await readFile(path.join(root,"runtime","trust","update-signing-public.pem")));
 if(manifest.toVersion!==approval.version||
    createHash("sha256").update(manifestBytes).digest("hex")!==preview.manifestSha256)
   throw Error("update-signed-content-changed");
 const current=JSON.parse(await readFile(path.join(root,"distribution-version.json"),"utf8"));
 const installed=await enumerateUpdateableFiles(root);
 requireCompatibleBase(manifest,current.version,installed);
 await verifyUpdatePayload(extracted,manifest);
 const prepared=path.join(updates,"prepared",approval.id);
 const rollback=path.join(updates,"rollback",approval.id);
 await mkdir(prepared,{recursive:true});
 const preparedInfo=await lstat(prepared);
 if(!preparedInfo.isDirectory()||preparedInfo.isSymbolicLink())
  throw Error("update-prepared-unsafe");
 // Prepare a complete candidate before mutating any live application path.
 if(manifest.mode==="delta"){
  for(const name of NAMES)await maybeCopy(path.join(root,name),path.join(prepared,name));
 }
 for(const entry of manifest.files){
  const location=path.join(prepared,...entry.path.split("/"));
  if(entry.action==="delete"){
   await rm(location,{force:true});
  }else{
   await mkdir(path.dirname(location),{recursive:true});
   await cp(path.join(extracted,"payload",...entry.path.split("/")),location,{force:true});
  }
 }
 const finalFiles=await enumerateUpdateableFiles(prepared);
 const expected=new Map(manifest.mode==="delta"?installed:new Map());
 for(const entry of manifest.files){
  const key=entry.path.toLowerCase();
  if(entry.action==="delete")expected.delete(key);
  else expected.set(key,{path:entry.path,sha256:entry.sha256});
 }
 if(expected.size!==finalFiles.size)throw Error("update-prepared-inventory-size-invalid");
 for(const [key,item] of expected){
  if(finalFiles.get(key)?.sha256!==item.sha256)throw Error("update-prepared-hash-invalid");
 }
 const proposed=JSON.parse(await readFile(path.join(prepared,"distribution-version.json"),"utf8"));
 if(proposed.version!==manifest.toVersion||proposed.sourceCommit!==manifest.sourceCommit)
  throw Error("update-version-file-invalid");
 await mkdir(rollback,{recursive:true});
 const rollbackInfo=await lstat(rollback);
 if(!rollbackInfo.isDirectory()||rollbackInfo.isSymbolicLink()||
    (await readdir(rollback)).length!==0)
  throw Error("update-rollback-not-empty");
 const moved=[];
 try{
  await status("applying",manifest.toVersion);
  for(const name of NAMES){
   const live=path.join(root,name),back=path.join(rollback,name),next=path.join(prepared,name);
   let old=false,newer=false;
   try{const info=await lstat(live);if(info.isSymbolicLink())throw Error("update-live-symlink");
    await rename(live,back);old=true;
   }catch(e){if(e?.code!=="ENOENT")throw e;}
   moved.push({name,old,newer:false});
   try{await lstat(next);await rename(next,live);newer=true;}
   catch(e){if(e?.code!=="ENOENT")throw e;}
   moved[moved.length-1].newer=newer;
  }
  await status("succeeded",manifest.toVersion);
 }catch(error){
  for(const item of moved.reverse()){
   const live=path.join(root,item.name),back=path.join(rollback,item.name);
   if(item.newer)await rename(live,path.join(prepared,item.name));
   if(item.old)await rename(back,live);
  }
  await status("failed",current.version).catch(()=>{});
  throw error;
 }
 // Keep previous application files for explicit rollback review (SMN-428).
 await rm(pending,{force:true});
 console.log("Mise à jour activée : "+manifest.toVersion);
}
try{await run();}
catch(error){
 try{await rm(pending,{force:true});}catch{}
 try{await status("failed",null);}catch{}
 // Do not print file names, credentials or archive contents in the console.
 console.error("Installation de mise à jour refusée ou interrompue.");
 process.exitCode=1;
}
