import {randomBytes} from "node:crypto";
import {Client} from "pg";
import type {CutoverDrillInput} from "./restore-cutover-drill";
import {validateCutoverDrill} from "./restore-cutover-drill";
import {validateFileCutoverDrill,inspectRestoreFileTree,
 type FileCutoverInput} from "./restore-file-cutover-drill";

/**
 * SMN-34 — Read-only EXTERNAL-operator preflight, DISPOSABLE namespaces only.
 *
 * The operator must run outside Next.js. This is not a production activation
 * token and does not stop HTTP, workers, cron jobs or external PG writers.
 * No database renames, filesystem renames, session mutations or marker writes.
 */
export type DisposableOfflineScope=Readonly<{
 maintenanceUri:string;
 original:string;candidate:string;rollback:string;
 files:FileCutoverInput;
}>;
export type DisposableOfflineReport=Readonly<{
 mode:"disposable-only";canActivate:false;
 database:Readonly<{status:"unverifiable"|"ready"|"blocked";
  pg18:boolean;namesCorrect:boolean;concurrentConnections:number|null}>;
 files:Readonly<{status:"unverifiable"|"ready"|"blocked";
  originalFingerprint:string|null;candidateFingerprint:string|null}>;
 blockers:readonly string[];
}>;

export function validateDisposableOfflineScope(input:DisposableOfflineScope):boolean{
 const cutover:CutoverDrillInput={
  maintenanceUri:input.maintenanceUri,original:input.original,
  candidate:input.candidate,rollback:input.rollback,
  // Required validator fields; generated in memory and never exposed.
  auditKeyHex:randomBytes(32).toString("hex"),
  journalDir:input.files.originalRoot
 };
 return validateCutoverDrill(cutover)&&validateFileCutoverDrill(input.files);
}

export async function inspectDisposableOfflineScope(
 input:DisposableOfflineScope
):Promise<DisposableOfflineReport>{
 const result=(status:DisposableOfflineReport["database"]["status"],
  pg18:boolean,namesCorrect:boolean,connections:number|null,
  fileStatus:DisposableOfflineReport["files"]["status"],
  originalFingerprint:string|null,candidateFingerprint:string|null,
  blockers:string[]):DisposableOfflineReport=>({
  mode:"disposable-only",canActivate:false,
  database:{status,pg18,namesCorrect,concurrentConnections:connections},
  files:{status:fileStatus,originalFingerprint,candidateFingerprint},blockers
 });
 if(!validateDisposableOfflineScope(input))
  return result("blocked",false,false,null,"blocked",null,null,
   ["disposable-scope-invalid"]);
 const blockers:string[]=[];
 let pg18=false,namesCorrect=false,connections:number|null=null;
 let dbStatus:DisposableOfflineReport["database"]["status"]="unverifiable";
 const client=new Client({connectionString:input.maintenanceUri,
  connectionTimeoutMillis:3500,statement_timeout:6000,query_timeout:6000,
  application_name:"smn34-disposable-operator-preflight"});
 try{
  await client.connect();
  await client.query("BEGIN TRANSACTION READ ONLY");
  try{
   const version=await client.query<{major:string}>(
    "SELECT current_setting('server_version') AS major");
   pg18=version.rows[0]?.major?.startsWith("18.")===true;
   const names=await client.query<{datname:string}>(
    "SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])",
    [[input.original,input.candidate,input.rollback]]);
   const observed=new Set(names.rows.map(x=>x.datname));
   namesCorrect=observed.has(input.original)&&observed.has(input.candidate)&&
    !observed.has(input.rollback);
   const active=await client.query<{n:string}>(
    "SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity "+
    "WHERE datname=ANY($1::text[]) AND pid<>pg_backend_pid()",
    [[input.original,input.candidate]]);
   const count=Number(active.rows[0]?.n);
   connections=Number.isSafeInteger(count)&&count>=0?count:null;
   await client.query("COMMIT");
  }catch(error){
   await client.query("ROLLBACK").catch(()=>undefined);
   throw error;
  }
  dbStatus=pg18&&namesCorrect&&connections===0?"ready":"blocked";
 }catch{
  dbStatus="unverifiable";
 }finally{await client.end().catch(()=>undefined);}
 if(!pg18)blockers.push("postgres18-unverified");
 if(!namesCorrect)blockers.push("disposable-databases-unverified");
 if(connections===null)blockers.push("connections-unverifiable");
 else if(connections>0)blockers.push("connections-present");
 let fileStatus:DisposableOfflineReport["files"]["status"]="unverifiable";
 let originalFingerprint:string|null=null,candidateFingerprint:string|null=null;
 try{
  const [a,b]=await Promise.all([
   inspectRestoreFileTree(input.files.originalRoot),
   inspectRestoreFileTree(input.files.candidateRoot)
  ]);
  originalFingerprint=a.sha256;candidateFingerprint=b.sha256;
  fileStatus=b.count>0?"ready":"blocked";
 }catch{fileStatus="blocked";}
 if(fileStatus!=="ready")blockers.push("candidate-files-unverified");
 // This only qualifies a *test namespace*; never elevates an active SMN.
 return result(dbStatus,pg18,namesCorrect,connections,fileStatus,
  originalFingerprint,candidateFingerprint,blockers);
}
