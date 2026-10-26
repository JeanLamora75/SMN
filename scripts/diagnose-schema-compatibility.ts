/**
 * Diagnostic PostgreSQL SMN en lecture seule.
 * N'affiche jamais l'URL, le mot de passe, les valeurs des tables ou des chemins Windows.
 */
import {existingManagedUri} from "../src/server/bootstrap/portable";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";
import {INSTALLATION_RELATIONS} from "../src/server/installation/contract";

async function main(){
 const uri=await existingManagedUri();
 if(!uri){
  console.log("PostgreSQL portable SMN non configuré.");
  process.exitCode=1;return;
 }
 const result=await probePostgres(uri);
 const authorized=new Set<string>(INSTALLATION_RELATIONS);
 const unrecognized=[...new Set(result.tables.filter(name=>!authorized.has(name)))].sort();
 const status=classifySnapshot(result).status;
 console.log("Diagnostic SMN :",status);
 console.log("Objets SQL détectés :",result.tables.length);
 console.log("Objets non reconnus :",unrecognized.length);
 for(const name of unrecognized)console.log(" -",name);
 if(result.installations?.[0])
  console.log("Version de schéma enregistrée :",result.installations[0].schema_version);
 else if(unrecognized.length)
  console.log("Le diagnostic SQL s'arrête avant la lecture des migrations tant que ces objets ne sont pas reconnus.");
 if(status!=="initialized")process.exitCode=1;
}
main().catch(error=>{
 const code=error&&typeof error==="object"&&"code" in error?String(error.code):"non catégorisée";
 console.error("Diagnostic impossible. Code technique :",/^[a-zA-Z0-9_-]{1,20}$/.test(code)?code:"non catégorisée");
 process.exitCode=1;
});
