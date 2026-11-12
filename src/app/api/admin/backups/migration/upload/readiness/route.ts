import {NextRequest} from "next/server";
import {lstat,readFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withSessionReadDb} from "@/server/auth/database";
import {existingManagedUri} from "@/server/bootstrap/portable";
import {restoreMaintenanceActive} from "@/server/backup/restore-maintenance";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const TOKEN=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/** Never infer permission to overwrite from a verified ZIP alone.
 * The currently exported single-entry ZIP does not include an authenticated
 * source receipt, independent erasure evidence or a launcher-owned job.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",
  {type:"backups",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input||Object.keys(input).length!==1||
  typeof input.token!=="string"||!TOKEN.test(input.token))
  return jsonResult({error:"invalid-input"},400);
 const folder=join(process.cwd(),"data","migration-inbox");
 try{
  const metaFile=join(folder,input.token+".json");
  const tar=join(folder,input.token+".tar.gz");
  const metaStat=await lstat(metaFile),tarStat=await lstat(tar);
  if(!metaStat.isFile()||metaStat.isSymbolicLink()||
   !tarStat.isFile()||tarStat.isSymbolicLink()||
   metaStat.size>8192||metaStat.size<20||tarStat.size<32)
   throw Error("migration-readiness-inbox-invalid");
  const meta=JSON.parse(await readFile(metaFile,"utf8")) as {
   archiveId?:string;state?:string;hasTransferEvidence?:boolean
  };
  if(!/^[a-f0-9-]{36}$/i.test(meta.archiveId??"")||
   meta.state!=="awaiting-verification")
   throw Error("migration-readiness-token-invalid");
  const destination=await withSessionReadDb(async db=>{
   const state=await db.query<{state:string;schema_version:number;created_at:Date}>(
    "SELECT state,schema_version,created_at FROM public.smn_installation "+
    "WHERE id='singleton'");
   const tables=await db.query<{count:string}>(
    "SELECT count(*)::text AS count FROM pg_catalog.pg_tables "+
    "WHERE schemaname='public'");
   const row=state.rows[0];
   if(state.rowCount!==1||row?.state!=="initialized"||
    !Number.isInteger(row.schema_version))
    throw Error("migration-readiness-installation-unverified");
   return {initialized:true as const,schemaVersion:row.schema_version,
    containsExistingTables:Number(tables.rows[0]?.count)>0};
  });
  const verified=await readFile(join(folder,input.token+".verified.json"),"utf8")
   .then(text=>JSON.parse(text) as {archiveId?:string;sourceEvidenceVerified?:boolean})
   .catch(()=>null);
  const proofReady=meta.hasTransferEvidence===true&&
   verified?.archiveId===meta.archiveId&&verified.sourceEvidenceVerified===true;
  const managed=await existingManagedUri().then(Boolean).catch(()=>false);
  const maintenance=await restoreMaintenanceActive();
  const supervisor=existsSync(join(process.cwd(),"app","maintenance","migration",
   "smn-gui-offline-restore.mjs"));
  const blockers=[
   ...(!proofReady?["source-receipt-not-in-zip",
    "independent-erasure-evidence-not-in-zip"]:[]),
   ...(!supervisor?["automatic-cutover-supervisor-not-qualified"]:[]),
   ...(!managed?["destination-not-managed"]:[]),
   ...(destination.schemaVersion!==33?["destination-schema-incompatible"]:[]),
   ...(maintenance?["destination-maintenance-active"]:[])
  ];
  return jsonResult({archiveId:meta.archiveId,destination,
   readyForUpload:true,mayStartOfflineRestore:blockers.length===0,
   restorationAuthorized:false,sourceEvidenceVerified:proofReady,
   independentSourceRetirementCertified:false,blockers},200);
 }catch{
  return jsonResult({error:"migration-readiness-unverifiable",
   restorationAuthorized:false},409);
 }
}
