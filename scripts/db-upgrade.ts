/** Orchestrateur conservateur : seule la transition v31 -> v32 est automatisée. */
import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
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
 if(!existsSync("scripts/apply-team-agile-mode-v32.ts"))
   throw Error("Migration v32 absente");
 const result=spawnSync(process.execPath,["--import","tsx","scripts/apply-team-agile-mode-v32.ts","--apply"],
   {stdio:"inherit",shell:false,env:process.env});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error("Migration v32 échouée, code "+String(result.status));
 const after=await inspect();
 if(decideUpgrade(after.status,after.version,after.migrations).kind!=="noop")
   throw Error("Post-contrôle v32 échoué : "+JSON.stringify(after));
 console.log("Mise à niveau v32 validée.");
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
