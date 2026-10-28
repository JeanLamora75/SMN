#!/usr/bin/env node
// Contrôle consolidé : n'active jamais le multiéquipes et ne modifie pas la base.
import {spawnSync} from "node:child_process";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
const root=process.cwd();
const readiness=readFileSync(join(root,"src/lib/team-context-readiness.ts"),"utf8");
if(!/SMN_MULTI_TEAM_CONTEXT_READY/.test(readiness)||\n   !/SMN_MULTI_TEAM_PILOT_ACK/.test(readiness)){
 console.error("FAIL: verrou de livraison modifié ; vérification interrompue");
 process.exit(2);
}
if(process.env.SMN_MULTI_TEAM_CONTEXT_READY==="true"||\n   process.env.SMN_MULTI_TEAM_WRITES_ENABLED==="true"){\n console.error("FAIL: désactiver les variables multiéquipes avant cette recette");\n process.exit(2);\n}\nconsole.log("PASS: activation multiéquipes non demandée");
const pnpm=process.platform==="win32"?"pnpm.cmd":"pnpm";
const checks=[
 ["TypeScript",pnpm,["exec","tsc","--noEmit"]],
 ["Tests statiques et simulés",pnpm,["exec","tsx","--test",
   "tests/team-isolation-*.test.ts","tests/team-context-v30-*.test.ts"]],
 ["Diagnostic PostgreSQL",pnpm,["db:diagnose"]],
 ["Recette PostgreSQL en lecture seule",pnpm,["exec","tsx","scripts/audit-v30-live-readonly.ts"]]
];
let errors=0;
for(const [label,command,args] of checks){
 console.log("\n--- "+label+" ---");
 const result=spawnSync(command,args,{cwd:root,stdio:"inherit",shell:process.platform==="win32"});
 if(result.status!==0){errors++;console.error("FAIL "+label+": "+(result.status??"execution impossible"));}
 else console.log("PASS "+label);
}
console.log("\nBilan : "+(checks.length-errors)+"/"+checks.length+" contrôles réussis");
if(errors)process.exitCode=1;
