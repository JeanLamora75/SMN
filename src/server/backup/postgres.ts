import {createCipheriv,createHash,randomBytes} from "node:crypto";
import {spawn,execFile} from "node:child_process";
import {promisify} from "node:util";
import {createWriteStream,existsSync} from "node:fs";
import {Transform} from "node:stream";
import {pipeline} from "node:stream/promises";
import {join} from "node:path";
import type {BackupComponent} from "./files";
import {sha} from "./files";

const exec=promisify(execFile);
function dumpExecutable():string{
 if(process.env.SMN_PG_DUMP_PATH)return process.env.SMN_PG_DUMP_PATH;
 if(process.platform==="win32"){
  const base=process.env.LOCALAPPDATA;
  if(base){
   const path=join(base,"ScrumMasterNotebook","pgsql","bin","pg_dump.exe");
   if(existsSync(path))return path;
  }
  return "pg_dump.exe";
 }
 return "pg_dump";
}
/**
 * Pg_dump custom format fournit un snapshot PostgreSQL consistant.
 * Le dump traverse un pipe AES-GCM : aucun dump non chiffré ne touche le disque.
 * Le mot de passe passe par l'environnement du seul sous-processus, jamais par argv/log.
 */
export async function encryptedPgDump(connectionString:string,key:Buffer,destination:string):
 Promise<BackupComponent>{
 const executable=dumpExecutable();
 let version="";
 try{
  const result=await exec(executable,["--version"],{timeout:10_000,windowsHide:true});
  version=result.stdout;
 }catch{throw new Error("backup-pg-dump-unavailable");}
 if(!/\b18\.\d+\b/.test(version))throw new Error("backup-pg-dump-version");
 const uri=new URL(connectionString);
 const database=decodeURIComponent(uri.pathname.slice(1));
 if(!database||key.length!==32)throw new Error("backup-database-config-invalid");
 const args=["--no-password","--format=custom","--no-owner","--no-acl",
  "--host",uri.hostname,"--port",uri.port||"5432",
  "--username",decodeURIComponent(uri.username),"--dbname",database];
 const child=spawn(executable,args,{windowsHide:true,stdio:["ignore","pipe","pipe"],
  env:{...process.env,PGPASSWORD:decodeURIComponent(uri.password)}});
 let discarded=0;
 child.stderr.on("data",(chunk:Buffer)=>{discarded+=chunk.length;});
 const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,nonce);
 const hash=createHash("sha256");let originalSize=0;
 const tally=new Transform({transform(chunk:Buffer,_encoding,done){
  originalSize+=chunk.length;
  hash.update(chunk);
  if(originalSize>8*1024*1024*1024){
   done(new Error("backup-database-too-large"));return;
  }
  done(null,chunk);
 }});
 const exited=new Promise<void>((resolve,reject)=>{
  child.once("error",()=>reject(new Error("backup-pg-dump-failed")));
  child.once("close",code=>code===0?resolve():reject(new Error("backup-pg-dump-failed")));
 });
 const stream=pipeline(child.stdout!,tally,cipher,
  createWriteStream(destination,{flags:"wx",mode:0o600}));
 try{
  await Promise.all([stream,exited]);
  if(originalSize<=0)throw new Error("backup-database-empty");
  const {stat,readFile}=await import("node:fs/promises");
  const size=(await stat(destination)).size;
  const encrypted=await readFile(destination);
  return {path:"database.pgcustom.enc",sha256:hash.digest("hex"),size:originalSize,
   encryptedSha256:sha(encrypted),encryptedSize:size,nonce:nonce.toString("hex"),
   tag:cipher.getAuthTag().toString("hex")};
 }catch{
  child.kill();
  throw new Error("backup-pg-dump-failed");
 }
}
