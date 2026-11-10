import "server-only";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {readFile,writeFile,mkdir,lstat,rm} from "node:fs/promises";
import path from "node:path";

export type UpdatePreview={id:string;actor:string;nonce:string;fromVersion:string;toVersion:string;
 mode:"full"|"delta";files:number;changes:number;deletions:number;bytes:number;
 sourceCommit:string;manifestSha256:string;archiveSha256:string;checkedAt:string};
export const updateRoot=()=>path.join(process.cwd(),"updates");
const ID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const NONCE=/^[0-9a-f]{48}$/;
export function isUpdateId(id:unknown):id is string{return typeof id==="string"&&ID.test(id);}
export function isUpdateNonce(n:unknown):n is string{return typeof n==="string"&&NONCE.test(n);}
export async function safeUpdatesRoot(){
 const root=updateRoot();
 const info=await lstat(root);
 if(!info.isDirectory()||info.isSymbolicLink())throw Error("update-directory-unsafe");
 return root;
}
export async function runUpdateScript(script:string,args:string[],timeout=150000):Promise<string>{
 if(!["import-update.mjs","verify-staged-update.mjs"].includes(script))
   throw Error("update-script-invalid");
 const root=process.cwd();
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(root,"scripts","windows",script),...args],{
   cwd:root,windowsHide:true,stdio:["ignore","pipe","pipe"],timeout,shell:false
  });
  let stdout="",stderr="";
  child.stdout.on("data",chunk=>{stdout+=String(chunk);if(stdout.length>20000)child.kill();});
  child.stderr.on("data",chunk=>{stderr+=String(chunk);if(stderr.length>20000)child.kill();});
  child.on("error",()=>reject(Error("update-verification-unavailable")));
  child.on("close",code=>code===0?resolve(stdout.trim()):reject(Error("update-verification-failed")));
 });
}
export async function readPreview(id:string):Promise<UpdatePreview>{
 if(!isUpdateId(id))throw Error("update-id-invalid");
 const stage=path.join(await safeUpdatesRoot(),"staging",id);
 const info=await lstat(stage);
 if(!info.isDirectory()||info.isSymbolicLink())throw Error("update-stage-invalid");
 const preview=JSON.parse(await readFile(path.join(stage,"preview.json"),"utf8")) as UpdatePreview;
 if(preview.id!==id || !isUpdateNonce(preview.nonce) ||
  !ID.test(preview.actor)|| !/^33\.0\.[0-9]+$/.test(preview.toVersion) ||
  Date.now()-Date.parse(preview.checkedAt)>30*60*1000)throw Error("update-preview-expired");
 return preview;
}
export async function stageUpdateArchive(bytes:Buffer,actor:string):Promise<UpdatePreview>{
 if(!isUpdateId(actor)||bytes.length<100||bytes.length>120*1024*1024)
   throw Error("update-upload-invalid");
 const root=await safeUpdatesRoot();
 const staging=path.join(root,"staging");
 await mkdir(staging,{recursive:true,mode:0o700});
 const stagingInfo=await lstat(staging);
 if(!stagingInfo.isDirectory()||stagingInfo.isSymbolicLink())throw Error("update-staging-unsafe");
 const id=randomUUID(),stage=path.join(staging,id);
 await mkdir(stage,{mode:0o700});
 try{
  await writeFile(path.join(stage,"incoming.zip"),bytes,{flag:"wx",mode:0o600});
  await runUpdateScript("import-update.mjs",["--root",process.cwd(),"--id",id,"--actor",actor]);
  return await readPreview(id);
 }catch(e){await rm(stage,{recursive:true,force:true});throw e;}
}
