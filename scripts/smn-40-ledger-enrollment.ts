/**
 * Explicit local enrollment of a NEW external erasure history, not retroactive
 * evidence. Windows-only, fail-closed, no writes to SMN PostgreSQL.
 */
import {randomBytes} from "node:crypto";
import {spawnSync} from "node:child_process";
import {mkdir,lstat,writeFile} from "node:fs/promises";
import {dirname} from "node:path";
import {Client} from "pg";
import {privacyLedgerPaths} from "./windows/privacy-ledger-env.mjs";
import {installedDatabaseUri} from "../src/server/auth/database";
import {inspectPrivacySchema} from "./smn-40-maintenance";
import {initializeErasureLedger,readErasureLedger} from "../src/server/backup/erasure-ledger";
import {isSafeNativeDatabase,protectionKeys,
 inspectPrivacyInstallPreflight} from "./smn-40-privacy-install-preflight";

const CONFIRM="--confirm=ENROLL_NEW_HISTORY_FROM_TODAY";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function parseLedgerEnrollmentArgs(args:readonly string[]){
 if(args.length===1&&args[0]==="--check")return "check";
 if(args.length===4&&args[0]==="--enroll"&&args[1]==="--archive"&&
  UUID.test(args[2])&&args[3]===CONFIRM)
  return "enroll";
 throw Error("privacy-ledger-enrollment-arguments-invalid");
}
async function exists(path:string){
 return !!await lstat(path).catch((e:NodeJS.ErrnoException)=>{
  if(e.code==="ENOENT")return null;throw e;
 });
}
export function assessLedgerEnrollment(input:{
 guardsInstalled:number;ledgerExists:boolean;anchorExists:boolean;
 keyExists:boolean;schemaVersion:number;windows:boolean;
}){
 const already= input.ledgerExists||input.anchorExists||input.keyExists;
 return {canEnrollNewHistory:input.windows&&input.schemaVersion===33&&
   input.guardsInstalled===7&&!already,
  alreadyEnrolled:input.ledgerExists&&input.anchorExists&&input.keyExists,
  historicalCoverageComplete:false as const,restorationAuthorized:false as const};
}
async function inspect(){
 if(process.platform!=="win32")throw Error("privacy-ledger-windows-required");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const uri=await installedDatabaseUri();
 if(!isSafeNativeDatabase(uri))throw Error("privacy-ledger-unsafe-database");
 const {ledger,anchor,keyFile}=privacyLedgerPaths();
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:12000,application_name:"smn40-ledger-enrollment-check"});
 try{
  await db.connect();
  await db.query("BEGIN READ ONLY");
  const state=await inspectPrivacySchema(db);
  const installed=protectionKeys.filter(x=>state[x]===true).length;
  await db.query("ROLLBACK");
  const [ledgerExists,anchorExists,keyExists]=await Promise.all([
   exists(ledger),exists(anchor),exists(keyFile)]);
  let integrity:"not-enrolled"|"verified"|"unverifiable"="not-enrolled";
  let coverageStart:string|null=null;
  if(ledgerExists||anchorExists||keyExists){
   integrity="unverifiable";
   if(ledgerExists&&anchorExists&&keyExists){
    try{
     const state=await readErasureLedger();
     coverageStart=state.coverageStart;
     integrity="verified";
    }catch{/* Tampered/missing material must remain unverified. */}
   }
  }
  return {installed,ledger,anchor,keyFile,integrity,coverageStart,
   decision:assessLedgerEnrollment({guardsInstalled:installed,ledgerExists,
    anchorExists,keyExists,schemaVersion:state.schema_version,windows:true})};
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
async function enroll(state:Awaited<ReturnType<typeof inspect>>){
 if(!state.decision.canEnrollNewHistory)throw Error("privacy-ledger-enrollment-denied");
 const secret=randomBytes(32).toString("hex");
 const command=`$ErrorActionPreference='Stop'; $s=[Console]::In.ReadToEnd().Trim(); if($s -notmatch '^[a-f0-9]{64}$'){throw 'invalid-key'}; $v=ConvertTo-SecureString -String $s -AsPlainText -Force; [Console]::Out.Write((ConvertFrom-SecureString -SecureString $v))`;
 const result=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",command],{
  windowsHide:true,encoding:"utf8",input:secret,timeout:10000,maxBuffer:2048
 });
 const encrypted=result.status===0?result.stdout.trim():"";
 if(!/^[0-9a-f]{80,2048}$/i.test(encrypted))
  throw Error("privacy-ledger-dpapi-encryption-failed");
 // Exclusive creation ensures existing history/key cannot be reset silently.
 await mkdir(dirname(state.ledger),{recursive:true,mode:0o700});
 await mkdir(dirname(state.anchor),{recursive:true,mode:0o700});
 // Atomic exclusive directory creation refuses concurrent enrollments.
 await mkdir(state.ledger,{mode:0o700});
 await mkdir(state.anchor,{mode:0o700});
 await writeFile(state.keyFile,encrypted,{flag:"wx",mode:0o600});
 process.env.SMN_ERASURE_LEDGER_DIR=state.ledger;
 process.env.SMN_ERASURE_ANCHOR_DIR=state.anchor;
 process.env.SMN_ERASURE_LEDGER_KEY_HEX=secret;
 try{
  await initializeErasureLedger();
  const verified=await readErasureLedger();
  if(verified.markers.length!==0)throw Error("privacy-ledger-not-empty");
  return {status:"enrolled" as const,coverageStart:verified.coverageStart,
   initialMarkers:0,preEnrollmentHistoryAttested:false as const};
 }finally{
  delete process.env.SMN_ERASURE_LEDGER_DIR;
  delete process.env.SMN_ERASURE_ANCHOR_DIR;
  delete process.env.SMN_ERASURE_LEDGER_KEY_HEX;
 }
}
async function main(){
 const mode=parseLedgerEnrollmentArgs(process.argv.slice(2));
 const state=await inspect();
 if(mode==="check"){
  process.stdout.write(JSON.stringify({mode:"check",guardsInstalled:state.installed,
   ledgerIntegrity:state.integrity,coverageStart:state.coverageStart,
   ...state.decision})+"\n");
  return;
 }
 // Refuse enrollment while the app is reachable, the SQL connection is
 // shared, or the exact archive cannot be authenticated.
 if(["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX"].some(k=>!!process.env[k]))
  throw Error("privacy-ledger-legacy-configuration-present");
 const preflight=await inspectPrivacyInstallPreflight(process.argv[4]);
 if(!preflight.decision.readyForExplicitGuardsInstallation)
  throw Error("privacy-ledger-offline-preflight-refused");
 const outcome=await enroll(state);
 process.stdout.write(JSON.stringify({mode:"enrollment",...outcome,
  restorationAuthorized:false})+"\n");
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-ledger-enrollment.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 ledger enrollment denied or incomplete; do not retry without inspection.\n");
  process.exitCode=2;
 });
