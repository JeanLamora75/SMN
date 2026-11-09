import {createHmac,randomUUID,timingSafeEqual} from "node:crypto";
import {lstat,open,readFile,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {erasureLedgerConfig,readErasureLedger,appendCompletedErasure} from "./erasure-ledger";

const FILENAME="pending-erasure-intent.json";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const SHA=/^[a-f0-9]{64}$/;
type Intent=Readonly<{version:1;id:string;createdAt:string;planRevision:string;
 operation:"erase"|"anonymize";mac:string}>;
export type IntentHandle=Readonly<{id:string;planRevision:string}>;
function signature(key:Buffer,input:Omit<Intent,"mac">):string{
 return createHmac("sha256",key).update([
  "smn-erasure-intent-v1",input.version,input.id,input.createdAt,
  input.planRevision,input.operation
 ].join("|")).digest("hex");
}
async function parseIntent(anchor:string,key:Buffer):Promise<Intent|null>{
 const path=join(anchor,FILENAME);
 const stat=await lstat(path).catch((e:NodeJS.ErrnoException)=>{
  if(e.code==="ENOENT")return null;throw e;
 });
 if(!stat)return null;
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)
  throw Error("erasure-intent-untrusted");
 const value=JSON.parse(await readFile(path,"utf8")) as Intent;
 if(value.version!==1||!UUID.test(value.id)||!SHA.test(value.planRevision)||
  !["erase","anonymize"].includes(value.operation)||!SHA.test(value.mac)||
  !Number.isFinite(Date.parse(value.createdAt))||
  new Date(value.createdAt).toISOString()!==value.createdAt)
  throw Error("erasure-intent-invalid");
 if(!timingSafeEqual(Buffer.from(value.mac,"hex"),
  Buffer.from(signature(key,value),"hex")))throw Error("erasure-intent-tampered");
 return value;
}
/** Missing intent is safe; unreadable/tampered intent is NOT safe. */
export async function hasUnresolvedErasureIntent():Promise<boolean>{
 const config=erasureLedgerConfig();
 if(!config)throw Error("erasure-ledger-unconfigured");
 try{return (await parseIntent(config.anchor,config.key))!==null;}
 finally{config.key.fill(0);}
}
/**
 * Must be persisted BEFORE any database or file change. This is a journal
 * of intent, not a certificate of erasure. Only stable, non-identifying
 * plan revisions are stored; no member IDs, names, or text.
 */
export async function beginErasureIntent(input:{
 planRevision:string;operation:"erase"|"anonymize"
},now=new Date()):Promise<IntentHandle>{
 if(!SHA.test(input.planRevision)||!["erase","anonymize"].includes(input.operation)||
  !Number.isFinite(now.getTime()))throw Error("erasure-intent-invalid");
 const state=await readErasureLedger();
 if(now.toISOString()<state.coverageStart)throw Error("erasure-ledger-coverage-gap");
 const config=erasureLedgerConfig();
 if(!config)throw Error("erasure-ledger-unconfigured");
 try{
  const value:Omit<Intent,"mac">={
   version:1,id:randomUUID(),createdAt:now.toISOString(),
   planRevision:input.planRevision,operation:input.operation
  };
  const file=join(config.anchor,FILENAME);
  await writeFile(file,JSON.stringify({...value,mac:signature(config.key,value)}),
   {flag:"wx",mode:0o600});
  const f=await open(file,"r+");try{await f.sync();}finally{await f.close();}
  return {id:value.id,planRevision:value.planRevision};
 }finally{config.key.fill(0);}
}
/**
 * Called only AFTER a successful database COMMIT and verified file actions.
 * If any step fails the pending intent remains, blocking all restorations.
 */
export async function finalizeErasureIntent(handle:IntentHandle):Promise<void>{
 if(!UUID.test(handle.id)||!SHA.test(handle.planRevision))
  throw Error("erasure-intent-invalid");
 const config=erasureLedgerConfig();
 if(!config)throw Error("erasure-ledger-unconfigured");
 const lock=join(config.anchor,".erasure-finalize.lock");
 let acquired=false;
 try{
  const fd=await open(lock,"wx",0o600);await fd.close();acquired=true;
  const pending=await parseIntent(config.anchor,config.key);
  if(!pending||pending.id!==handle.id||pending.planRevision!==handle.planRevision)
   throw Error("erasure-intent-mismatch");
  await appendCompletedErasure(pending.operation,new Date(),pending.id);
  await rm(join(config.anchor,FILENAME));
 }finally{
  if(acquired)await rm(lock,{force:true});
  config.key.fill(0);
 }
}
