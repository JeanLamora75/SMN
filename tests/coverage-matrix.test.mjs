import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkCatalog,loadRequirements,parseTap,reportCoverage} from "../scripts/coverage-matrix.mjs";

const catalog=JSON.parse(readFileSync(new URL("coverage/requirements.json",import.meta.url),"utf8"));
const requirements=loadRequirements();

test("la matrice contient les 43 décisions BMAD et leurs 22 scénarios sans doublon",()=>{
 assert.equal(checkCatalog(catalog,requirements),true);
 assert.equal(requirements.length,43);
 assert.equal(catalog.scenarios.length,22);
 assert.ok(catalog.critical.length>=6);
});

test("un contrôle de présence de fichier ne constitue jamais une preuve d'exécution",()=>{
 const report=reportCoverage(catalog,requirements);
 assert.equal(report.summary.behaviorPassed,0);
 assert.ok(report.scenarios.some(x=>x.status==="source-only"));
 assert.ok(report.scenarios.some(x=>x.status==="not-run"));
 assert.ok(report.decisions.every(x=>x.status!=="behavior-pass"));
});

test("un scénario ne devient vérifié que si son propre nom apparaît comme réussi",()=>{
 const chosen=catalog.scenarios.find(x=>x.id==="RX-02");
 assert.ok(chosen);
 const tap="TAP version 13\nok 1 - "+chosen.evidence.title+" (7ms)\nnot ok 2 - unrelated failure\nok 3 - skipped # SKIP\n";
 const parsed=parseTap(tap);
 assert.equal(parsed.passed.length,1);
 assert.equal(parsed.failed.length,1);
 assert.equal(parsed.skipped.length,1);
 const report=reportCoverage(catalog,requirements,parsed);
 assert.equal(report.scenarios.find(x=>x.id==="RX-02")?.status,"passed");
 assert.equal(report.scenarios.find(x=>x.id==="RX-04")?.status,"not-verified");
 assert.equal(report.scenarios.find(x=>x.id==="RX-18")?.status,"source-only");
});

test("références manquantes et doublons de scénarios font échouer la vérification",()=>{
 const bad={...catalog,scenarios:[catalog.scenarios[0],...catalog.scenarios.slice(0,-1)]};
 assert.throws(()=>checkCatalog(bad,requirements),/duplicate RX/);
 const unknown={...catalog,critical:[...catalog.critical,{id:"BROKEN",evidence:{
  file:"tests/nonexistent.test.ts",title:"absent",kind:"behavior"
 }}]};
 assert.throws(()=>checkCatalog(unknown,requirements),/ENOENT/);
});
