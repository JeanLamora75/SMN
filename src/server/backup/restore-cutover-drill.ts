import {open,readFile,lstat,rm,writeFile} from "node:fs/promises";
import {dirname,join,resolve,isAbsolute} from "node:path";
import {createHmac,randomUUID,timingSafeEqual} from "node:crypto";
import {Client} from "pg";

/**
 * OFFLINE CUTOVER DRILL ONLY. All three database names must be disposable
 * smn_restore_test_* on the same local PostgreSQL 18 server.
 *
 * Production installs intentionally cannot call this operation. PostgreSQL
 * ALTER DATABASE cannot be rolled back as a transaction; a separately
 * fsynced intent record and a retained rollback DB are mandatory.
 */
const DB=/^smn_restore_test_[a-z0-9_]{6,40}$/;
const LOCAL=new Set(["localhost","127.0.0.1","[::1]"]);
const STAGES=new Set(["intent","source-parked","candidate-promoted",
 "verified","rollback-started","rolled-back","incident"]);
export type CutoverStage="intent"|"source-parked"|"candidate-promoted"|
 "verified"|"rollback-started"|"rolled-back"|"incident";
export type CutoverEvidence=Readonly<{
 id:string;original:string;candidate:string;rollback:string;
 stage:CutoverStage;at:string;reason:string;previousMac:string;mac:string;
}>;
export type CutoverDrillInput=Readonly<{
 maintenanceUri:string;original:string;candidate:string;rollback:string;
 journalDir:string;auditKeyHex:string;injectFailureAfterPark?:boolean;injectFailureAfterPromotion?:boolean;
}>;
const HEX=/^[a-f0-9]{64}$/;
const ZERO="0".repeat(64);
const sign=(key:string,e:Omit<CutoverEvidence,"mac">)=>
 createHmac("sha256",Buffer.from(key,"hex")).update([
  "smn34-cutover-v1",e.id,e.original,e.candidate,e.rollback,
  e.stage,e.at,e.reason,e.previousMac
 ].join("|")).digest("hex");
const quote=(name:string)=>'"'+name+'"';
export function validateCutoverDrill(input:CutoverDrillInput):boolean{
 try{
  const uri=new URL(input.maintenanceUri);
  return (uri.protocol==="postgres:"||uri.protocol==="postgresql:")&&
   LOCAL.has(uri.hostname)&&decodeURIComponent(uri.pathname)==="/postgres"&&
   !uri.searchParams.has("options")&&!!uri.username&&!!uri.password&&
   [input.original,input.candidate,input.rollback].every(n=>DB.test(n))&&
   new Set([input.original,input.candidate,input.rollback]).size===3&&
   isAbsolute(input.journalDir)&&resolve(input.journalDir)===input.journalDir&&
   HEX.test(input.auditKeyHex);
 }catch{return false;}
}
async function safeJournal(dir:string){
 const stat=await lstat(dir);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error("cutover-journal-untrusted");
}
function serializable(e:CutoverEvidence):boolean{
 return !!e&&/^[a-f0-9-]{36}$/i.test(e.id)&&
  [e.original,e.candidate,e.rollback].every(n=>DB.test(n))&&
  STAGES.has(e.stage)&&Number.isFinite(Date.parse(e.at))&&
  HEX.test(e.previousMac)&&HEX.test(e.mac);
}
async function saveEvidence(path:string,e:CutoverEvidence):Promise<void>{
 if(!serializable(e))throw Error("cutover-evidence-invalid");
 const fd=await open(path,"a",0o600);
 try{await fd.writeFile(JSON.stringify(e)+"\n");await fd.sync();}
 finally{await fd.close();}
}
export async function readCutoverDrillJournal(file:string,auditKeyHex:string):Promise<CutoverEvidence[]>{
 if(!HEX.test(auditKeyHex))throw Error("cutover-audit-key-invalid");
 const stat=await lstat(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>1024*1024)
  throw Error("cutover-journal-untrusted");
 const raw=await readFile(file,"utf8");
 if(!raw.endsWith("\n"))throw Error("cutover-journal-torn");
 const events=raw.trimEnd().split("\n").map(s=>JSON.parse(s) as CutoverEvidence);
 if(!events.length||events.some(e=>!serializable(e)))throw Error("cutover-journal-invalid");
 let previous=ZERO;
 const allowed:Record<CutoverStage,readonly CutoverStage[]>={
  intent:["source-parked"],"source-parked":["candidate-promoted","rollback-started"],
  "candidate-promoted":["verified","incident"],verified:[],
  "rollback-started":["rolled-back","incident"],"rolled-back":[],incident:[]
 };
 for(let i=0;i<events.length;i++){
  const e=events[i];
  const expected=Buffer.from(sign(auditKeyHex,e),"hex");
  if(e.previousMac!==previous||!timingSafeEqual(expected,Buffer.from(e.mac,"hex")))
   throw Error("cutover-journal-signature-invalid");
  if(i>0&&!allowed[events[i-1].stage].includes(e.stage))
   throw Error("cutover-journal-transition-invalid");
  previous=e.mac;
 }
 const first=events[0];
 if(first.stage!=="intent"||events.some(e=>e.id!==first.id||
  e.original!==first.original||e.candidate!==first.candidate||
  e.rollback!==first.rollback))throw Error("cutover-journal-mixed");
 return events;
}
async function databaseList(db:Client,names:string[]):Promise<Set<string>>{
 const q=await db.query<{datname:string}>(
  "SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])",[names]);
 return new Set(q.rows.map(r=>r.datname));
}
async function noConnections(db:Client,names:string[]){
 const q=await db.query<{busy:string}>(
  "SELECT count(*)::text AS busy FROM pg_catalog.pg_stat_activity "+
  "WHERE datname=ANY($1::text[]) AND pid<>pg_backend_pid()",[names]);
 if(q.rows[0]?.busy!=="0")throw Error("cutover-open-connections");
}
/**
 * A controlled rehearsal of two PostgreSQL database renames. The caller
 * must prove its maintenance process has exclusive control of app requests.
 * A source database is never dropped: the rollback copy is retained.
 */
export async function rehearseOfflineDatabaseCutover(
 input:CutoverDrillInput
):Promise<Readonly<{journal:string;stage:CutoverStage;rollbackPreserved:boolean}>>{
 if(!validateCutoverDrill(input))throw Error("cutover-disposable-only");
 await safeJournal(input.journalDir);
 const client=new Client({connectionString:input.maintenanceUri,
  connectionTimeoutMillis:3500,statement_timeout:10000,
  application_name:"smn34-disposable-offline-cutover"});
 const id=randomUUID(),path=join(input.journalDir,id+".jsonl");
 let locked=false,parked=false,promoted=false,previousMac=ZERO;
 const event=async(stage:CutoverStage,reason="checked")=>{
  const unsigned={id,original:input.original,candidate:input.candidate,
   rollback:input.rollback,stage,at:new Date().toISOString(),reason,previousMac};
  const mac=sign(input.auditKeyHex,unsigned);
  await saveEvidence(path,{...unsigned,mac});
  previousMac=mac;
 };
 try{
  // Persist intent BEFORE the first PostgreSQL ALTER DATABASE.
  await writeFile(path,"",{flag:"wx",mode:0o600});
  await event("intent");
  await client.connect();
  const version=await client.query<{v:string}>(
   "SELECT current_setting('server_version') AS v");
  if(!version.rows[0]?.v.startsWith("18."))throw Error("cutover-pg18-required");
  const lock=await client.query<{ok:boolean}>(
   "SELECT pg_try_advisory_lock(20261109,34) AS ok");
  if(lock.rows[0]?.ok!==true)throw Error("cutover-already-running");
  locked=true;
  const names=await databaseList(client,[input.original,input.candidate,input.rollback]);
  if(!names.has(input.original)||!names.has(input.candidate)||names.has(input.rollback))
   throw Error("cutover-database-state-invalid");
  await noConnections(client,[input.original,input.candidate]);
  await client.query("ALTER DATABASE "+quote(input.original)+" RENAME TO "+quote(input.rollback));
  parked=true;
  await event("source-parked");
  if(input.injectFailureAfterPark)throw Error("cutover-fault-injected");
  await client.query("ALTER DATABASE "+quote(input.candidate)+" RENAME TO "+quote(input.original));
  promoted=true;
  await event("candidate-promoted");
  if(input.injectFailureAfterPromotion)throw Error("cutover-fault-injected-after-promotion");
  const after=await databaseList(client,[input.original,input.candidate,input.rollback]);
  if(!after.has(input.original)||!after.has(input.rollback)||after.has(input.candidate))
   throw Error("cutover-verification-failed");
  await event("verified");
  return {journal:path,stage:"verified",rollbackPreserved:true};
 }catch(error){
  if(parked&&!promoted){
   // Fail safe when only the original has been parked.
   try{
    await event("rollback-started");
    await noConnections(client,[input.rollback,input.candidate]);
    await client.query("ALTER DATABASE "+quote(input.rollback)+" RENAME TO "+quote(input.original));
    await event("rolled-back");
    return {journal:path,stage:"rolled-back",rollbackPreserved:false};
   }catch{
    await event("incident").catch(()=>undefined);
    throw Error("cutover-manual-recovery-required");
   }
  }
  if(promoted){
   await event("incident").catch(()=>undefined);
   // After promotion the outcome requires independent inspection.
   // Never reverse only files while PostgreSQL might be active.
   throw Error("cutover-manual-recovery-required");
  }
  const reason=error instanceof Error?error.message:"unknown";
  const allow=new Set(["cutover-open-connections","cutover-database-state-invalid",
   "cutover-already-running","cutover-pg18-required","cutover-verification-failed",
   "cutover-journal-signature-invalid","cutover-journal-transition-invalid"]);
  if(process.env.SMN_CUTOVER_TEST_DIAGNOSTIC==="1"&&allow.has(reason))
   throw Error("cutover-denied:"+reason);
  throw Error("cutover-denied");
 }finally{
  if(locked)await client.query("SELECT pg_advisory_unlock(20261109,34)")
   .catch(()=>undefined);
  await client.end().catch(()=>undefined);
 }
}
