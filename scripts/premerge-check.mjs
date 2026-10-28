#!/usr/bin/env node
/**
 * Recette SMN avant consolidation. Lecture seule vis-a-vis de PostgreSQL :
 * aucune migration, seed ou creation de cycle n'est appelee.
 * Usage : node scripts/premerge-check.mjs [--skip-build] [--skip-db]
 */
import {spawnSync} from "node:child_process";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const flags=new Set(process.argv.slice(2));
const accepted=new Set(["--skip-build","--skip-db"]);
if([...flags].some(flag=>!accepted.has(flag))){
 console.error("Usage : node scripts/premerge-check.mjs [--skip-build] [--skip-db]");
 process.exit(2);
}
const stages=[
 {name:"TypeScript",args:["exec","tsc","--noEmit"]},
 {name:"ESLint",args:["lint"]},
 {name:"Traductions",args:["i18n:check"]},
 {name:"Tests complets",args:["test"]},
 ...(!flags.has("--skip-build")?[{name:"Build Next.js",args:["build"]}]:[]),
 ...(!flags.has("--skip-db")?[{name:"Diagnostic PostgreSQL (lecture seule)",args:["db:diagnose"]}]:[])
];
const startedAt=new Date().toISOString();
const results=[];
console.log("=== SMN : recette pre-fusion ===");
console.log("Aucune migration ni ecriture metier volontaire. Les tests individuels sont executes par pnpm test.");
for(const stage of stages){
 console.log("\n=== "+stage.name+" ===");
 const t0=Date.now();
 const run=spawnSync(process.platform==="win32"?"pnpm.cmd":"pnpm",stage.args,{
  cwd:root,stdio:"inherit",shell:process.platform==="win32",env:process.env
 });
 const passed=!run.error&&run.status===0;
 results.push({name:stage.name,passed,exitCode:run.status,
  durationMs:Date.now()-t0,error:run.error?.message??null});
 console.log("RESULTAT "+stage.name+" : "+(passed?"OK":"ECHEC"));
}
const report={title:"SMN - recette pre-fusion",startedAt,finishedAt:new Date().toISOString(),
 overallPassed:results.every(item=>item.passed),stages:results,
 limitations:[
  "Tests PostgreSQL concurrents et isolation transactionnelle reelle non couverts par ce lanceur.",
  "Le diagnostic valide le schema, pas la compatibilite metier de toutes les requetes.",
  "Ne pas activer les ecritures multi-equipes sans une recette d'integration sur une base de test."
 ]};
const outputDirectory=join(root,"_bmad-output");
mkdirSync(outputDirectory,{recursive:true});
const output=join(outputDirectory,"premerge-check-report.json");
writeFileSync(output,JSON.stringify(report,null,2)+"\n","utf8");
console.log("\n=== BILAN ===");
for(const stage of results)console.log((stage.passed?"OK":"ECHEC")+" - "+stage.name);
console.log("Rapport : "+output);
console.log("Resultat global : "+(report.overallPassed?"OK":"ECHEC"));
process.exitCode=report.overallPassed?0:1;
