/**
 * Read-only checkpoint verification for SMN-40 before deploying privacy guards.
 * This is NOT a restore authorization: checking archive integrity does not
 * establish privacy history or an independently tested rollback.
 */
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {withSessionReadDb} from "../src/server/auth/database";
import {inspectExtraArchives} from "../src/server/backup/extra-archives";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
export function assessBackupReadiness(input:{
 archiveStatus:string;archiveIntegrity:boolean;schemaVersion:number|null;
 inventoryVerified:boolean;previewIssues:readonly string[];
}){
 return {
  bytesAndManifestVerified:input.archiveStatus==="verified"&&input.archiveIntegrity,
  compatibleV33:input.schemaVersion===33,
  documentsInventoryVerified:input.inventoryVerified,
  previewIssues:input.previewIssues,
  independentlyRestoredAndRollbackQualified:false as const,
  privacyHistoryQualified:false as const,
  deploymentAuthorized:false as const
 };
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==3||args[0]!=="--archive"||!UUID.test(args[1])||
  args[2]!=="--check")throw Error("backup-readiness-args-invalid");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const preview=await previewBackupReadOnly(args[1]);
 let inventoryVerified=false;
 let counts:{pdf:number;officeReports:number;officeTemplates:number}|null=null;
 try{
  const value=await withSessionReadDb(db=>inspectExtraArchives(db));
  counts={pdf:value.pdf.length,officeReports:value.office.length,
   officeTemplates:value.templates.length};
  inventoryVerified=true;
 }catch{/* Missing, invalid or unavailable files remain unverified. */}
 const result=assessBackupReadiness({
  archiveStatus:preview.archive.status,
  archiveIntegrity:preview.archive.integrityVerified,
  schemaVersion:preview.current.schemaVersion,
  inventoryVerified,previewIssues:preview.issues
 });
 process.stdout.write(JSON.stringify({mode:"read-only",archiveId:args[1],
  archiveCreatedAt:preview.archive.createdAt,archiveStatus:preview.archive.status,
  documentInventory:counts,result},null,2)+"\n");
 if(!result.bytesAndManifestVerified||!result.compatibleV33||
  !result.documentsInventoryVerified)process.exitCode=2;
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/")
 .endsWith("/smn-40-backup-readiness.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 backup readiness unverified; no restore performed.\n");
  process.exitCode=2;
 });
