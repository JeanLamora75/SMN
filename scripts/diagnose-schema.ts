import {parseConnectionSettings} from "../src/server/db/config";
import {loadExistingUri} from "../src/server/bootstrap/settings";
import {existingManagedUri} from "../src/server/bootstrap/portable";
import {probePostgres} from "../src/server/db/probe";
import {INSTALLATION_RELATIONS} from "../src/server/installation/contract";
import {classifySnapshot} from "../src/server/installation/diagnostic";

async function main(){
 const settings=parseConnectionSettings(process.env.SMN_DATABASE_URL);
 if(!settings.ok&&settings.status!=="configuration-missing"){
  console.error("Configuration PostgreSQL invalide");process.exitCode=1;return;
 }
 const uri=settings.ok?settings.uri:(await loadExistingUri()??await existingManagedUri());
 if(!uri){console.error("Configuration PostgreSQL SMN introuvable");process.exitCode=1;return;}
 const snapshot=await probePostgres(uri);
 const known=new Set<string>(INSTALLATION_RELATIONS);
 const unexpected=[...new Set(snapshot.tables.filter(name=>!known.has(name)))].sort();
 console.log("Diagnostic:",classifySnapshot(snapshot).status);
 console.log("Version de schéma:",snapshot.installations?.[0]?.schema_version??"non lue");
 console.log("Nombre d'objets inconnus:",unexpected.length);
 for(const name of unexpected)console.log("Objet inconnu:",name);
 if(snapshot.installations?.[0]?.schema_version===undefined)
  console.log("Version non lue : le contrôle s'arrête avant la lecture du marqueur en présence d'objets inconnus.");
}
main().catch(error=>{
 console.error("Diagnostic impossible:",error instanceof Error?error.name:"erreur inconnue");
 process.exitCode=1;
});
