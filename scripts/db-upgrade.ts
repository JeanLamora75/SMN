/** v32 native is the baseline. Historical upgrades are explicit maintenance only. */
import {installedDatabaseUri} from "../src/server/auth/database";
import {probePostgres} from "../src/server/db/probe";
import {classifySnapshot} from "../src/server/installation/diagnostic";
import {decideUpgrade} from "./db-upgrade-policy";

async function inspect(){
 const snapshot=await probePostgres(await installedDatabaseUri());
 const status=classifySnapshot(snapshot).status;
 const version=snapshot.installations?.[0]?.schema_version;
 const migrations=snapshot.migrations?.filter(m=>m.finished_at&&!m.rolled_back_at).length;
 return {status,version,migrations};
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length>1||args.some(a=>!["--apply","--check"].includes(a))||
   (args.includes("--apply")&&args.includes("--check")))
   throw Error("Usage : pnpm db:upgrade [--check|--apply]");
 const before=await inspect();
 const decision=decideUpgrade(before.status,before.version,before.migrations);
 console.log(JSON.stringify({before,decision},null,2));
 if(decision.kind==="refuse")throw Error(decision.reason);
 if(decision.kind==="noop")return;
 if(!args.includes("--apply")){
   console.log("Prévisualisation seule. Utiliser --apply après sauvegarde de la base.");
   return;
 }
 throw Error("Aucune migration automatique historique. La baseline v32 est le point de départ. Utiliser une procédure de maintenance dédiée pour les anciennes bases.");
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
