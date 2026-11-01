import {createHash} from "node:crypto";
import {existsSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {installedDatabaseUri} from "../src/server/auth/database";
export const proofPath=()=>resolve(process.cwd(),".next","smn-351-proof.json");
export function sourceFingerprint(uri:string){
 const u=new URL(uri);
 if(!["localhost","127.0.0.1","::1"].includes(u.hostname)||u.pathname!=="/smn")throw Error("local SMN source required");
 return createHash("sha256").update([u.protocol,u.hostname,u.port||"5432",u.username,u.pathname].join("|")).digest("hex");
}
export type Proof={version:1;source:string;createdAt:string;comparison:{identical:true;freshHash:string;migratedHash:string;freshCount:number;migratedCount:number};restoration:{historyPreserved:true;isolated:true};backup:{backupRestored:true;candidateRowsPreserved:true;isolated:true};cleanupAuthorized:false};
export function loadProof(source:string):Proof|null{
 if(!existsSync(proofPath()))return null;
 try{
  const p=JSON.parse(readFileSync(proofPath(),"utf8")) as Proof;
  return p.version===1&&p.source===source&&Date.now()-Date.parse(p.createdAt)<24*3600000&&Date.parse(p.createdAt)<=Date.now()&&
   p.comparison?.identical===true&&p.comparison.freshHash===p.comparison.migratedHash&&
   Number.isSafeInteger(p.comparison.freshCount)&&p.comparison.freshCount>0&&p.comparison.freshCount===p.comparison.migratedCount&&
   p.restoration?.historyPreserved===true&&p.restoration.isolated===true&&
   p.backup?.backupRestored===true&&p.backup.candidateRowsPreserved===true&&p.backup.isolated===true&&p.cleanupAuthorized===false?p:null;
 }catch{return null;}
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")throw Error("Usage: pnpm db:prove:smn-351 --check");
 const source=sourceFingerprint(await installedDatabaseUri());
 const run=(args:string[])=>{
  const p=spawnSync("pnpm",args,{encoding:"utf8",shell:process.platform==="win32",timeout:240000,maxBuffer:4*1024*1024});
  if(p.stdout)process.stdout.write(p.stdout);
  if(p.stderr)process.stderr.write(p.stderr);
  if(p.error||p.status!==0)throw Error("Proof command failed: "+args.join(" "));
  return p.stdout;
 };
 const comparisonOutput=run(["db:compare:smn-351:auto"]);
 const compare=JSON.parse(comparisonOutput.slice(comparisonOutput.indexOf("{"),comparisonOutput.lastIndexOf("}")+1)) as Record<string,unknown>;
 if(compare.identical!==true||compare.freshHash!==compare.migratedHash||compare.cleanupAuthorized!==false||
  typeof compare.freshCount!=="number"||compare.freshCount!==compare.migratedCount)throw Error("Schema comparison not proven");
 const restoreOutput=run(["db:prove:smn-351:history"]);
 const marker=restoreOutput.split(/\r?\n/).find(x=>x.startsWith('{"proof":"historical-v32-upgrade"'));
 if(!marker)throw Error("Historic v32 preservation proof missing");
 const restored=JSON.parse(marker) as Record<string,unknown>;
 if(restored.isolated!==true||restored.historyPreserved!==true||restored.cleanupAuthorized!==false)throw Error("Historic preservation not proven");
 const backupOutput=run(["db:prove:smn-351:backup"]);
 const backupMarker=backupOutput.split(/\r?\n/).find(x=>x.startsWith('{"proof":"smn-351-backup-restore"'));
 if(!backupMarker)throw Error("Backup restoration proof missing");
 const backup=JSON.parse(backupMarker) as Record<string,unknown>;
 if(backup.isolated!==true||backup.backupRestored!==true||backup.candidateRowsPreserved!==true||backup.cleanupAuthorized!==false)
  throw Error("Backup restoration not proven");
 const proof:Proof={version:1,source,createdAt:new Date().toISOString(),
  comparison:{identical:true,freshHash:String(compare.freshHash),migratedHash:String(compare.migratedHash),
   freshCount:Number(compare.freshCount),migratedCount:Number(compare.migratedCount)},
  restoration:{historyPreserved:true,isolated:true},backup:{backupRestored:true,candidateRowsPreserved:true,isolated:true},cleanupAuthorized:false};
 mkdirSync(resolve(process.cwd(),".next"),{recursive:true});
 writeFileSync(proofPath(),JSON.stringify(proof,null,2)+"\n",{mode:0o600});
 console.log(JSON.stringify({evidenceRecorded:true,location:".next/smn-351-proof.json",cleanupAuthorized:false}));
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/").endsWith("/smn-351-proof-record.ts"))
 main().catch(e=>{console.error(e);process.exitCode=2});
