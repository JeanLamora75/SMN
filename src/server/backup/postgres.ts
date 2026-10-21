import {createCipheriv,createHash,randomBytes} from "node:crypto";
import {spawn,execFile} from "node:child_process";
import {promisify} from "node:util";
import {createReadStream,createWriteStream,existsSync} from "node:fs";
import {Transform} from "node:stream";
import {pipeline} from "node:stream/promises";
import {join} from "node:path";
import type {BackupComponent} from "./files";


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
  signal:AbortSignal.timeout(15*60_000),
  env:{...process.env,PGPASSWORD:decodeURIComponent(uri.password)}});
 child.stderr?.resume();
 const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,nonce);
 const hash=createHash("sha256");let originalSize=0;
 const header=Buffer.alloc(5);let headerBytes=0;
 const tally=new Transform({transform(chunk:Buffer,_encoding,done){
  originalSize+=chunk.length;
  if(headerBytes<5){headerBytes+=chunk.copy(header,headerBytes,0,5-headerBytes);}
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
  if(originalSize<=0||header.toString("ascii")!=="PGDMP")
   throw new Error("backup-database-invalid");
  const {stat}=await import("node:fs/promises");
  const size=(await stat(destination)).size;
  const encryptedHash=createHash("sha256");
  for await(const block of createReadStream(destination))encryptedHash.update(block);
  return {path:"database.pgcustom.enc",sha256:hash.digest("hex"),size:originalSize,
   encryptedSha256:encryptedHash.digest("hex"),encryptedSize:size,nonce:nonce.toString("hex"),
   tag:cipher.getAuthTag().toString("hex")};
 }catch{
  child.kill();
  throw new Error("backup-pg-dump-failed");
 }
}
