#!/usr/bin/env node
/**
 * Recette globale SMN avec journal integral sur disque, y compris stderr.
 * Usage : node scripts/premerge-check.mjs [--skip-build] [--skip-db]
 * Sorties a la racine : SMN-premerge-full.log et SMN-premerge-summary.json
 */
import {spawn} from "node:child_process";
import {createWriteStream,writeFileSync} from "node:fs";
import {join,dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const flags=new Set(process.argv.slice(2));
if([...flags].some(flag=>!["--skip-build","--skip-db"].includes(flag))){
 console.error("Usage : node scripts/premerge-check.mjs [--skip-build] [--skip-db]");
 process.exit(2);
}
const logPath=join(root,"SMN-premerge-full.log");
const summaryPath=join(root,"SMN-premerge-summary.json");
const log=createWriteStream(logPath,{flags:"w",encoding:"utf8"});
let logFailure=null;
log.on("error",error=>{logFailure=error;console.error("Impossible d'ecrire le journal :",error.message);});
function write(message){
 const line=String(message);
 if(!logFailure)log.write(line);
 process.stdout.write(line);
}
function runStage(stage){
 return new Promise(resolveStage=>{
  const begin=Date.now();
  write("\n"+ "=".repeat(72)+"\n"+stage.name+"\n"+ "=".repeat(72)+"\n");
  // The child output is piped to the file as it arrives, not buffered in RAM.
  const child=spawn(process.platform==="win32"?"pnpm.cmd":"pnpm",stage.args,{
   cwd:root,env:{...process.env,FORCE_COLOR:"0",NO_COLOR:"1"},
   shell:process.platform==="win32",windowsHide:true,stdio:["ignore","pipe","pipe"]
  });
  let spawnError=null;
  child.stdout?.on("data",chunk=>write(chunk.toString("utf8")));
  child.stderr?.on("data",chunk=>write(chunk.toString("utf8")));
  child.on("error",error=>{spawnError=error.message;});
  child.on("close",(code,signal)=>{
   const passed=code===0&&!spawnError&&!signal;
   const result={name:stage.name,passed,exitCode:code,signal,
    durationMs:Date.now()-begin,error:spawnError};
   write("\nRESULTAT "+stage.name+" : "+(passed?"OK":"ECHEC")+" (code "+String(code)+")\n");
   resolveStage(result);
  });
 });
}
const steps=[
 {name:"TypeScript",args:["exec","tsc","--noEmit"]},
 {name:"ESLint",args:["lint"]},
 {name:"Traductions FR/EN",args:["i18n:check"]},
 {name:"Suite complete des tests",args:["test"]},
 ...(!flags.has("--skip-build")?[{name:"Build Next.js",args:["build"]}]:[]),
 ...(!flags.has("--skip-db")?[{name:"Diagnostic PostgreSQL",args:["db:diagnose"]}]:[])
];
const startedAt=new Date().toISOString();
const results=[];
write("SMN - recette pre-fusion\nDate de debut : "+startedAt+
 "\nDossier : "+root+"\nJournal : "+logPath+
 "\nAucune migration ni commande de creation de donnees n'est appelee par ce lanceur.\n");
for(const stage of steps)results.push(await runStage(stage));
const report={startedAt,finishedAt:new Date().toISOString(),
 overallPassed:results.every(s=>s.passed)&&!logFailure,stages:results,
 notes:[
  "Les tests existants peuvent creer des fichiers temporaires. Examiner le code des tests avant usage sur donnees sensibles.",
  "Le diagnostic SQL ne valide pas les transactions concurrentes reelles.",
  "Les ecritures multi-equipes restent bloquees en attente de validation."
 ]};
write("\n"+ "=".repeat(72)+"\nBILAN GLOBAL\n"+ "=".repeat(72)+"\n");
for(const stage of results)write((stage.passed?"OK":"ECHEC")+" | "+stage.name+
 " | "+stage.durationMs+" ms\n");
write("RESULTAT GLOBAL : "+(report.overallPassed?"OK":"ECHEC")+
 "\nJournal integral : "+logPath+"\nSynthese : "+summaryPath+"\n");
try{writeFileSync(summaryPath,JSON.stringify(report,null,2)+"\n","utf8");}
catch(error){console.error("Impossible d'ecrire la synthese :",error);process.exitCode=1;}
await new Promise(resolveLog=>log.end(resolveLog));
if(logFailure)process.exitCode=1;
else if(!report.overallPassed)process.exitCode=1;
