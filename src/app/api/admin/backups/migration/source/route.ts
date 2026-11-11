import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {backupRootPath} from "@/server/backup/runner";
import {backupInventory} from "@/server/backup/verification";
import {readErasureLedger} from "@/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "@/server/backup/erasure-intent";
import {assessMigrationSource} from "@/server/backup/migration-source-policy";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Verify the outgoing package and immutable ledger without exporting private
 * bytes or issuing any restoration capability. The destination MUST perform
 * its own independent authorization before activating restored records.
 */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"backups",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body||Object.keys(body).length!==1||
  typeof body.id!=="string"||!UUID.test(body.id))
  return jsonResult({error:"invalid-input"},400);
 try{
  const item=(await backupInventory(backupRootPath())).find(v=>v.id===body.id);
  if(!item)return jsonResult({error:"archive-not-found"},404);
  let ledger:{
   verified:boolean;coverageStart:string|null;pendingErasure:boolean;
   postArchiveErasureCount:number|null
  }={verified:false,coverageStart:null,pendingErasure:true,postArchiveErasureCount:null};
  try{
   const [state,pending]=await Promise.all([readErasureLedger(),hasUnresolvedErasureIntent()]);
   ledger={verified:true,coverageStart:state.coverageStart,
    pendingErasure:pending,
    postArchiveErasureCount:item.createdAt?
     state.markers.filter(m=>m.occurredAt>item.createdAt!).length:null};
  }catch{/* Unavailable evidence is never treated as an empty ledger. */}
  const report=assessMigrationSource(item,ledger);
  return jsonResult(report,report.exportCandidate?200:409);
 }catch{
  return jsonResult({error:"migration-source-unavailable"},503);
 }
}
