import {installedDatabaseUri} from "../src/server/auth/database";
import {backupRootPath} from "../src/server/backup/runner";
import {rehearseBackupRestore} from "../src/server/backup/restore-sandbox";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==3||args[0]!=="--archive"||!uuid.test(args[1])||
  args[2]!=="--sandbox-only")throw Error("usage");
 if(!process.env.SMN_DATABASE_URL||!process.env.SMN_RESTORE_TEST_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional local file */}
 }
 const sandbox=process.env.SMN_RESTORE_TEST_URL;
 if(!sandbox)throw Error("sandbox-config-missing");
 // Explicit target database must be precreated, empty and disposable.
 const result=await rehearseBackupRestore({
  sourceUri:await installedDatabaseUri(),sandboxUri:sandbox,
  backupRoot:backupRootPath(),archiveId:args[1]
 });
 process.stdout.write(JSON.stringify(result)+"\n");
 if(!result.databaseAndDocumentsConsistent)process.exitCode=1;
}
main().catch(error=>{
 const reason=error instanceof Error?error.message:"unknown";
 // Whitelist reasons: never output URLs, passwords, decrypted data or pg stderr.
 const safe=/^[a-z0-9-]{3,70}$/.test(reason)?reason:"rehearsal-failed";
 process.stderr.write("SMN-34 isolated rehearsal: "+safe+"\n");
 process.exitCode=1;
});
