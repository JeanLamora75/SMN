/**
 * Offline Windows/Linux import. The recovery phrase is supplied via stdin,
 * never on the process command line or in a repository file.
 */
import {importPortableBackup} from "../src/server/backup/portable-import";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
async function main(){
 if(!process.env.SMN_BACKUP_DIR){
  try{process.loadEnvFile(".env.local");}catch{/* Standard Windows backup root remains available. */}
 }
 const args=process.argv.slice(2);
 if(args.length!==4||args[0]!=="--archive"||!UUID.test(args[1])||
  args[2]!=="--file"||typeof args[3]!=="string")
  throw Error("portable-import-arguments-invalid");
 const parts:Buffer[]=[];
 let size=0;
 for await(const chunk of process.stdin){
  const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
  size+=b.length;
  if(size>2048)throw Error("portable-import-phrase-too-large");
  parts.push(b);
 }
 const secret=Buffer.concat(parts);
 try{
  const phrase=secret.toString("utf8").replace(/\r?\n$/,"");
  if(phrase.length<20||phrase.length>256||phrase.trim()!==phrase)
   throw Error("portable-import-phrase-invalid");
  const outcome=await importPortableBackup(args[3],args[1],phrase);
  process.stdout.write(JSON.stringify(outcome)+"\n");
 }finally{secret.fill(0);parts.forEach(b=>b.fill(0));}
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-portable-import.ts"))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",reason:"portable-import-unverified",
   activeInstallationModified:false,restorationAuthorized:false})+"\n");
  process.exitCode=2;
 });
