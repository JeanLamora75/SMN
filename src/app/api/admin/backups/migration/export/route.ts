import {NextRequest} from "next/server";
import {Readable} from "node:stream";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {backupRootPath} from "@/server/backup/runner";
import {backupInventory} from "@/server/backup/verification";
import {readErasureLedger} from "@/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "@/server/backup/erasure-intent";
import {assessMigrationSource} from "@/server/backup/migration-source-policy";
import {streamPortableBackup} from "@/server/backup/portable-package";
import {wrapEncryptedBackupInZip} from "@/server/backup/portable-zip";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"backups",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const id=request.nextUrl.searchParams.get("id");
 const format=request.nextUrl.searchParams.get("format")??"zip";
  if(!id||!ID.test(id)||!["zip","tar.gz"].includes(format)||
   request.nextUrl.searchParams.size>(request.nextUrl.searchParams.has("format")?2:1))
  return jsonResult({error:"invalid-input"},400);
 try{
  const root=backupRootPath();
  const item=(await backupInventory(root)).find(x=>x.id===id);
  if(!item)return jsonResult({error:"archive-not-found"},404);
  const [ledger,pending]=await Promise.all([
   readErasureLedger(),hasUnresolvedErasureIntent()
  ]);
  const report=assessMigrationSource(item,{
   verified:true,coverageStart:ledger.coverageStart,pendingErasure:pending,
   postArchiveErasureCount:item.createdAt?
    ledger.markers.filter(m=>m.occurredAt>item.createdAt!).length:null
  });
  if(!report.exportCandidate)return jsonResult({error:"migration-source-blocked",
   blockers:report.blockers},409);
  const compressed=await streamPortableBackup(root,item);
  const output=format==="zip"?wrapEncryptedBackupInZip(compressed,id):compressed;
  const body=Readable.toWeb(output) as ReadableStream<Uint8Array>;
  return new Response(body,{status:200,headers:{
   "Content-Type":format==="zip"?"application/zip":"application/gzip",
   "Content-Disposition":'attachment; filename="SMN-backup-'+id+(format==="zip"?".zip":".tar.gz")+'"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff"
  }});
 }catch{
  return jsonResult({error:"migration-export-unavailable"},503);
 }
}
