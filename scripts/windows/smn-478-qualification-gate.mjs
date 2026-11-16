/** Delivery qualification cannot be inferred from green source commits or static checks. */
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {lstat,readFile} from "node:fs/promises";
const CHECKS=[
 "unit","typecheck","lint","build","browser",
 "postgresEmpty","postgresHistory","postgresRollback",
 "windowsFresh","windowsUpgrade",
 "zipFreshRestore","zipUpgradeRestore"
];
export const smn478RequiredChecks=Object.freeze([...CHECKS]);
const SHA=/^[a-f0-9]{64}$/;
async function hashFile(file){
 const digest=createHash("sha256");
 for await(const bytes of createReadStream(file))digest.update(bytes);
 return digest.digest("hex");
}
export async function verifySmn478Qualification(receiptPath,commit){
 if(typeof receiptPath!=="string"||!receiptPath||typeof commit!=="string"||
  !/^[a-f0-9]{40}$/.test(commit))throw Error("smn478-delivery-proof-required");
 const info=await lstat(receiptPath);
 if(!info.isFile()||info.isSymbolicLink()||info.size>64*1024)
  throw Error("smn478-delivery-proof-invalid");
 const receipt=JSON.parse(await readFile(receiptPath,"utf8"));
 if(receipt.version!==1||receipt.gitCommit!==commit||
  receipt.environment!=="disposable"||
  !Number.isFinite(Date.parse(receipt.recordedAt))||
  !Array.isArray(receipt.checks)||
  receipt.checks.length!==CHECKS.length)
  throw Error("smn478-delivery-proof-invalid");
 const found=new Map();
 for(const c of receipt.checks){
  if(!c||typeof c.name!=="string"||!CHECKS.includes(c.name)||
   found.has(c.name)||c.result!=="passed"||!SHA.test(c.sha256)||
   typeof c.logPath!=="string"||!c.logPath||
   typeof c.runCommand!=="string"||!c.runCommand.trim()||
   c.disposable!==true)throw Error("smn478-delivery-check-rejected");
  found.set(c.name,c);
 }
 for(const name of CHECKS){
  const c=found.get(name);
  if(!c)throw Error("smn478-delivery-check-missing");
  const file=await lstat(c.logPath);
  if(!file.isFile()||file.isSymbolicLink()||file.size<=0||file.size>5*1024*1024)
   throw Error("smn478-delivery-log-invalid");
  if(await hashFile(c.logPath)!==c.sha256)
   throw Error("smn478-delivery-log-mismatch");
 }
 return {qualified:true,gitCommit:commit,checks:CHECKS.length};
}
