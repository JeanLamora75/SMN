import assert from "node:assert/strict";
import {test} from "node:test";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {emptyRecette,inspectRecetteEvidence,SCENARIOS} from "../scripts/windows/smn-34-recette-contract.mjs";
const valid=(i:number)=>({...emptyRecette().scenarios[i],
 status:"PASS",evidenceSha256:"a".repeat(64),observedAt:"2026-11-10T20:00:00.000Z"});
test("SMN-34: REC-01 a REC-14 identifies une fois, tous bloques par defaut",()=>{
 const plan=emptyRecette();
 assert.equal(plan.scenarios.length,14);
 assert.equal(new Set(plan.scenarios.map(v=>v.id)).size,14);
 assert.deepEqual(plan.scenarios.map(v=>v.id),SCENARIOS);
 const report=inspectRecetteEvidence(plan);
 assert.equal(report.canActivate,false);
 assert.equal(report.blocked,14);
 assert.equal(report.passed,0);
});
test("SMN-34: un dossier complet declaratif n'autorise jamais une restauration",()=>{
 const plan=emptyRecette();
 const report=inspectRecetteEvidence({...plan,
  scenarios:plan.scenarios.map((_,i)=>valid(i))});
 assert.equal(report.passed,14);
 assert.equal(report.blocked,0);
 assert.equal(report.state,"review-required");
 assert.equal(report.canActivate,false);
});
test("SMN-34: doublons, preuves absentes, valeurs malformees et liste partielle refusés",()=>{
 const plan=emptyRecette();
 const variants=[
  {...plan,scenarios:plan.scenarios.slice(0,13)},
  {...plan,scenarios:[plan.scenarios[0],...plan.scenarios.slice(0,13)]},
  {...plan,scenarios:plan.scenarios.map((v,i)=>i===0?{...v,status:"PASS"}:v)},
  {...plan,scenarios:plan.scenarios.map((v,i)=>i===0?{...v,status:"PASS",evidenceSha256:"a".repeat(64),observedAt:"invalid"}:v)},
  {...plan,scenarios:plan.scenarios.map((v,i)=>i===0?{...v,status:"FAIL",evidenceSha256:"a".repeat(64)}:v)}
 ];
 for(const value of variants){
  const result=inspectRecetteEvidence(value);
  assert.equal(result.canActivate,false);
  assert.ok(["schema-incomplete","evidence-invalid"].includes(result.reason));
  assert.equal(result.unverifiable,14);
 }
});
test("SMN-34: commande Windows template réelle ne communique aucun secret",()=>{
 const cwd=fileURLToPath(new URL("../",import.meta.url));
 const result=spawnSync(process.execPath,
  ["scripts/windows/smn-34-recette-check.mjs","--template"],{
   cwd,encoding:"utf8",timeout:10000
  });
 assert.equal(result.status,0,result.stderr);
 assert.deepEqual(JSON.parse(result.stdout),emptyRecette());
 assert.equal(result.stderr,"");
});
test("SMN-34: CLI refuse fichier relatif sans lire les documents",()=>{
 const cwd=fileURLToPath(new URL("../",import.meta.url));
 const result=spawnSync(process.execPath,
  ["scripts/windows/smn-34-recette-check.mjs","--check","relative.json"],{
   cwd,encoding:"utf8",timeout:10000
  });
 assert.equal(result.status,2,result.stderr);
 assert.equal(result.stdout,"");
 assert.match(result.stderr,/no restore performed/);
});
