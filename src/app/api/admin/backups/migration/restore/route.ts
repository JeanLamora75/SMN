import {NextRequest} from "next/server";
import {lstat,readFile,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withSessionReadDb} from "@/server/auth/database";
import {fingerprintPublicTables} from "@/server/backup/restore-row-fingerprint";
import {fingerprintCurrentManagedFiles} from "@/server/backup/current-managed-file-fingerprint";
import {encryptSetting} from "@/server/bootstrap/settings";
import {existingManagedUri} from "@/server/bootstrap/portable";
import {inspectBackup} from "@/server/backup/verification";
import {erasureLedgerConfig,readErasureLedger} from "@/server/backup/erasure-ledger";
import {restoreMaintenanceActive} from "@/server/backup/restore-maintenance";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/** Queues exactly one authenticated operator job. No SQL modifications and
 * never executes pg_restore inside the HTTP server. Only the owner launcher
 * can stop the server and run an offline migration.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",
  {type:"backups",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body||Object.keys(body).length!==2||
  typeof body.token!=="string"||!UUID.test(body.token)||
  body.confirm!=="REPLACE_CURRENT_SMN_WITH_VERIFIED_BACKUP")
  return jsonResult({error:"migration-confirmation-required"},400);
 if(process.platform!=="win32"||process.env.SMN_DATABASE_URL||
  await restoreMaintenanceActive())
  return jsonResult({error:"migration-restore-not-portable"},409);
 const token=body.token;
 const dir=join(process.cwd(),"data","migration-inbox");
 const work=join(process.cwd(),"data","migration-work",token);
 try{
  const [verificationStat,keyStat]=await Promise.all([
   lstat(join(dir,token+".verified.json")),lstat(join(work,".backup-key"))
  ]);
  if(!verificationStat.isFile()||verificationStat.isSymbolicLink()||
   verificationStat.size<30||verificationStat.size>8192||
   !keyStat.isFile()||keyStat.isSymbolicLink()||keyStat.size!==32)
   throw Error("migration-import-evidence-untrusted");
  const proof=JSON.parse(await readFile(join(dir,token+".verified.json"),"utf8")) as {
   archiveId?:string;sourceEvidenceVerified?:boolean
  };
  if(!proof.archiveId||!UUID.test(proof.archiveId)||
   proof.sourceEvidenceVerified!==true)
   throw Error("migration-source-evidence-not-verified");
  const key=await readFile(join(work,".backup-key"));
  let item;
  try{
   item=await inspectBackup(work,proof.archiveId,key);
  }finally{key.fill(0);}
  if(item.status!=="verified"||!item.integrityVerified||
   !item.scopeComplete||item.schemaVersion!==33)
   throw Error("migration-imported-backup-invalid");
  if(!await existingManagedUri())
   throw Error("migration-managed-runtime-required");
  const cfg=erasureLedgerConfig();
  if(cfg){
   try{
    const old=await readErasureLedger();
    if(old.markers.length>0)throw Error("migration-destination-erasure-history");
   }finally{cfg.key.fill(0);}
  }
  const destination=await withSessionReadDb(async db=>{
   const r=await db.query<{state:string;schema_version:number;created_at:Date}>(
    "SELECT state,schema_version,created_at FROM public.smn_installation "+
    "WHERE id='singleton'");
   const row=r.rows[0];
   if(r.rowCount!==1||row?.state!=="initialized"||
    row.schema_version!==33)
    throw Error("migration-destination-not-initialized");
   const database=await fingerprintPublicTables(db);
   const files=await fingerprintCurrentManagedFiles(db);
   return {identity:"singleton:"+new Date(row.created_at).toISOString(),
    databaseDigest:database.digest,filesDigest:files.sha256,
    filesCount:files.count};
  },{timeoutMs:120000});
  if(item.installationSource===destination.identity)
   throw Error("migration-same-installation");
  const pending=join(process.cwd(),"updates","migration-pending.json");
  const launcherFile=join(process.cwd(),"updates","launcher.json");
  const launcherStat=await lstat(launcherFile);
  if(!launcherStat.isFile()||launcherStat.isSymbolicLink()||
   launcherStat.size>2048||launcherStat.size<15)
   throw Error("migration-owner-launcher-not-verified");
  const launcher=JSON.parse(await readFile(launcherFile,"utf8")) as {
   pid?:number;at?:string
  };
  if(!Number.isInteger(launcher.pid)||!launcher.at||
   !Number.isFinite(Date.parse(launcher.at))||
   Math.abs(Date.now()-Date.parse(launcher.at))>15000)
   throw Error("migration-owner-launcher-inactive");
  const updateDir=await lstat(join(process.cwd(),"updates"));
  if(!updateDir.isDirectory()||updateDir.isSymbolicLink())
   throw Error("migration-updates-path-untrusted");
  const sealed=await encryptSetting(JSON.stringify({
   version:1,token,archiveId:proof.archiveId,
   destination:destination.identity,
   destinationDigest:destination.databaseDigest,
   destinationFilesDigest:destination.filesDigest,
   destinationFilesCount:destination.filesCount,
   requestedAt:new Date().toISOString(),operation:"gui-portable-restore"
  }));
  await writeFile(pending,JSON.stringify({version:1,sealed}),{
   flag:"wx",mode:0o600
  });
  return jsonResult({state:"scheduled",restorationCompleted:false,
   authenticationWillBeRequired:true},202);
 }catch{
  return jsonResult({error:"migration-restore-preflight-refused",
   restorationCompleted:false},409);
 }
}
