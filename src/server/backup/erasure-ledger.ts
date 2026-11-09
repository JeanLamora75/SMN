import {createHmac,randomBytes,timingSafeEqual} from "node:crypto";
import {appendFile,lstat,mkdir,open,readFile,rename,rm,writeFile} from "node:fs/promises";
import {isAbsolute,join,resolve,sep} from "node:path";
import {createErasureMarker,verifyErasureChain,ERASURE_GENESIS_MAC,
 type ErasureMarker} from "./erasure-evidence-format";

/**
 * Independent evidence store for SMN-40. Never include these directories or
 * the signing key in an SMN backup. A separate anchored watermark detects
 * truncation and partially completed appends. Neither path is an OS-level WORM.
 * This store must not be initialized automatically during a restore.
 */
export type LedgerSnapshot=Readonly<{
 coverageStart:string;checkedAt:string;markers:readonly ErasureMarker[];
}>;
type Anchor={version:1;coverageStart:string;count:number;headMac:string;seal:string};
const NAME="erasure-ledger.jsonl",ANCHOR="erasure-anchor.json";
const HEX=/^[a-f0-9]{64}$/,DATE=(s:string)=>typeof s==="string"&&
 Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
const sign=(key:Buffer,a:Omit<Anchor,"seal">)=>createHmac("sha256",key)
 .update(["smn-erasure-anchor-v1",a.version,a.coverageStart,a.count,a.headMac].join("|")).digest("hex");
const constrained=(root:string)=>isAbsolute(root)&&resolve(root)===root;
const nested=(a:string,b:string)=>{
 const x=process.platform==="win32"?a.toLowerCase():a;
 const y=process.platform==="win32"?b.toLowerCase():b;
 return x===y||x.startsWith(y+sep)||y.startsWith(x+sep);
};

export function erasureLedgerConfig():{ledger:string;anchor:string;key:Buffer}|null{
 const left=process.env.SMN_ERASURE_LEDGER_DIR;
 const right=process.env.SMN_ERASURE_ANCHOR_DIR;
 const secret=process.env.SMN_ERASURE_LEDGER_KEY_HEX;
 if(!left&&!right&&!secret)return null;
 if(!left||!right||!secret||!HEX.test(secret)||
  !constrained(left)||!constrained(right))throw Error("erasure-ledger-config-invalid");
 const ledger=resolve(left),anchor=resolve(right);
 if(nested(ledger,anchor))throw Error("erasure-ledger-config-overlap");
 const fallback=process.platform==="win32"&&process.env.LOCALAPPDATA?
  join(process.env.LOCALAPPDATA,"ScrumMasterNotebook","backups"):null;
 const protectedStores=[process.env.SMN_BACKUP_DIR??fallback,
  process.env.SMN_PRIVATE_DOCUMENTS_DIR,
  process.env.SMN_OFFICE_REPORTS_DIR,process.env.SMN_OFFICE_TEMPLATES_DIR]
  .filter((x):x is string=>typeof x==="string"&&x.length>0);
 for(const store of protectedStores){
  if(!isAbsolute(store))throw Error("erasure-ledger-protected-path-invalid");
  if(nested(ledger,resolve(store))||nested(anchor,resolve(store)))
   throw Error("erasure-ledger-backup-overlap");
 }
 return {ledger,anchor,key:Buffer.from(secret,"hex")};
}
async function checkedFolder(path:string):Promise<void>{
 const stat=await lstat(path);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error("erasure-ledger-path-untrusted");
}
function secureAnchor(key:Buffer,a:Omit<Anchor,"seal">):Anchor{
 return {...a,seal:sign(key,a)};
}
async function readAnchor(path:string,key:Buffer):Promise<Anchor>{
 const stat=await lstat(path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)
  throw Error("erasure-ledger-anchor-untrusted");
 const a=JSON.parse(await readFile(path,"utf8")) as Anchor;
 if(a.version!==1||!DATE(a.coverageStart)||!Number.isSafeInteger(a.count)||
  a.count<0||!HEX.test(a.headMac)||!HEX.test(a.seal))throw Error("erasure-ledger-anchor-invalid");
 const expected=Buffer.from(sign(key,a),"hex"),found=Buffer.from(a.seal,"hex");
 if(!timingSafeEqual(expected,found))throw Error("erasure-ledger-anchor-tampered");
 return a;
}
/** Strictly read-only: never repairs a torn write by hiding an entry. */
export async function readErasureLedger():Promise<LedgerSnapshot>{
 const config=erasureLedgerConfig();
 if(!config)throw Error("erasure-ledger-unconfigured");
 const {ledger,anchor,key}=config;
 try{
  await checkedFolder(ledger);await checkedFolder(anchor);
  const a=await readAnchor(join(anchor,ANCHOR),key);
  const file=join(ledger,NAME),stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16*1024*1024)
   throw Error("erasure-ledger-file-untrusted");
  const lines=(await readFile(file,"utf8")).split("\n");
  if(lines.at(-1)!=="")throw Error("erasure-ledger-torn-write");
  lines.pop();
  if(lines.length!==a.count)throw Error("erasure-ledger-truncation-or-pending-append");
  const markers:ErasureMarker[]=lines.map(line=>JSON.parse(line) as ErasureMarker);
  if(!verifyErasureChain(key,markers)||markers.some(m=>m.occurredAt<a.coverageStart)||
   (markers.at(-1)?.mac??ERASURE_GENESIS_MAC)!==a.headMac)
   throw Error("erasure-ledger-chain-invalid");
  return {coverageStart:a.coverageStart,checkedAt:new Date().toISOString(),markers};
 }finally{key.fill(0);}
}
/** Enrollment is a separate, explicit operator action on a new external store. */
export async function initializeErasureLedger(now=new Date()):Promise<void>{
 const config=erasureLedgerConfig();
 if(!config||!DATE(now.toISOString()))throw Error("erasure-ledger-unconfigured");
 const {ledger,anchor,key}=config;
 try{
  await mkdir(ledger,{recursive:true,mode:0o700});
  await mkdir(anchor,{recursive:true,mode:0o700});
  await checkedFolder(ledger);await checkedFolder(anchor);
  const file=join(ledger,NAME),aFile=join(anchor,ANCHOR);
  await writeFile(file,"",{flag:"wx",mode:0o600});
  try{
   const a=secureAnchor(key,{version:1,coverageStart:now.toISOString(),
    count:0,headMac:ERASURE_GENESIS_MAC});
   await writeFile(aFile,JSON.stringify(a),{flag:"wx",mode:0o600});
  }catch(error){await rm(file,{force:true});throw error;}
 }finally{key.fill(0);}
}
/**
 * Only a fully completed exceptional erasure may invoke this.
 * Lock + fsync append + separately anchored checkpoint. An interrupted
 * append is intentionally not reconciled automatically (fail closed).
 */
export async function appendCompletedErasure(operation:"erase"|"anonymize",
 now=new Date(),eventId?:string,subjectToken?:string):Promise<ErasureMarker>{
 const config=erasureLedgerConfig();
 if(!config)throw Error("erasure-ledger-unconfigured");
 const {ledger,anchor,key}=config,lock=join(anchor,".erasure-ledger.lock");
 let locked=false;
 try{
  const handle=await open(lock,"wx",0o600);await handle.close();locked=true;
  const state=await readErasureLedger();
  const existing=state.markers.find(m=>m.eventId===eventId);
  if(existing){
   if(existing.operation!==operation||existing.subjectToken!==subjectToken)
    throw Error("erasure-ledger-event-conflict");
   return existing;
  }
  const last=state.markers.at(-1);
  if(now.toISOString()<state.coverageStart||
   last&&now.toISOString()<last.occurredAt)throw Error("erasure-ledger-time-reversal");
  const marker=createErasureMarker(key,last?.mac??ERASURE_GENESIS_MAC,operation,now,eventId,subjectToken);
  const file=join(ledger,NAME);
  await appendFile(file,JSON.stringify(marker)+"\n",{encoding:"utf8"});
  const fd=await open(file,"r+");
  try{await fd.sync();}finally{await fd.close();}
  const a=secureAnchor(key,{version:1,coverageStart:state.coverageStart,
   count:state.markers.length+1,headMac:marker.mac});
  const temp=join(anchor,".anchor-"+randomBytes(8).toString("hex"));
  try{
   await writeFile(temp,JSON.stringify(a),{flag:"wx",mode:0o600});
   const f=await open(temp,"r+");try{await f.sync();}finally{await f.close();}
   await rename(temp,join(anchor,ANCHOR));
  }finally{await rm(temp,{force:true});}
  return marker;
 }finally{
  if(locked)await rm(lock,{force:true});
  key.fill(0);
 }
}
