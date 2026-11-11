/**
 * Read-only destination check after an encrypted portable package and the
 * independent erasure ledger have been imported to a NEW Windows profile.
 * Does not create a database, import an erasure ledger, or authorize cutover.
 */
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import {backupRootPath} from "../src/server/backup/runner";
import {inspectBackup} from "../src/server/backup/verification";
import {assessMigrationSource} from "../src/server/backup/migration-source-policy";
import {readErasureLedger} from "../src/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function inspectImportedMigration(archiveId:string){
 if(!UUID.test(archiveId))throw Error("migration-archive-id-invalid");
 const root=backupRootPath();
 const keyPath=join(root,".backup-key");
 const stat=await lstat(keyPath);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==32)
  throw Error("migration-key-untrusted");
 const key=await readFile(keyPath);
 try{
  const item=await inspectBackup(root,archiveId,key);
  let ledger:{
   verified:boolean;coverageStart:string|null;pendingErasure:boolean;
   postArchiveErasureCount:number|null
  }={verified:false,coverageStart:null,pendingErasure:true,
   postArchiveErasureCount:null};
  try{
   const snapshot=await readErasureLedger();
   const pending=await hasUnresolvedErasureIntent();
   ledger={verified:true,coverageStart:snapshot.coverageStart,pendingErasure:pending,
    postArchiveErasureCount:item.createdAt?
     snapshot.markers.filter(m=>m.occurredAt>item.createdAt!).length:null};
  }catch{/* Never interpret an unavailable ledger as an empty one. */}
  const result=assessMigrationSource(item,ledger);
  return {mode:"imported-migration-preflight" as const,archiveId,
   packageVerified:item.status==="verified"&&item.integrityVerified===true,
   externalLedgerVerified:ledger.verified&&!ledger.pendingErasure,
   candidateReconstructionAllowed:result.exportCandidate,
   blockers:result.blockers,warnings:result.warnings,
   historicalCoverageCertified:false as const,
   restorationAuthorized:false as const,
   activeInstallationModified:false as const};
 }finally{key.fill(0);}
}
async function main(){
 if(!process.env.SMN_BACKUP_DIR){
  try{process.loadEnvFile(".env.local");}catch{/* Default Windows root. */}
 }
 const args=process.argv.slice(2);
 if(args.length!==3||args[0]!=="--archive"||args[2]!=="--check"||
  !UUID.test(args[1]))throw Error("migration-arguments-invalid");
 const result=await inspectImportedMigration(args[1]);
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(!result.candidateReconstructionAllowed)process.exitCode=2;
}
if(process.argv[1]?.replaceAll("\\","/")
 .match(/\/smn-40-migration-destination-check\.(?:ts|mjs)$/))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({
   status:"blocked",reason:"migration-destination-unverifiable",
   restorationAuthorized:false,activeInstallationModified:false
  })+"\n");
  process.exitCode=2;
 });
