import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const services=["items.ts","relations.ts","comments.ts","cycle-links.ts","assessment.ts","roam.ts",
 "action-links.ts","confirmed-highlights.ts","deadlines.ts","decision-actions.ts",
 "decision-detail.ts","dependency-parties.ts","dependency-vigilance.ts",
 "fact-selection.ts","highlight-invalidation.ts"];
test("Registres: tous les services métier du répertoire évitent les DDL",()=>{
 for(const file of readdirSync(new URL("../src/server/registries/",import.meta.url)).filter(name=>name.endsWith(".ts"))){
  const s=read("src/server/registries/"+file);
  assert.doesNotMatch(s,/\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b/i,file);
  if(services.includes(file))assert.match(s,/registry-schema-not-ready/,file);
 }
});
test("Registres: les deux migrations sont explicites, transactionnelles et non destructives",()=>{
 const core=read("scripts/apply-registry-core-v32.ts");
 const ext=read("scripts/apply-registry-extensions-v32.ts");
 for(const s of [core,ext]){
  assert.match(s,/schema_version!==32/);
  assert.match(s,/pg_advisory_xact_lock/);
  assert.match(s,/ROLLBACK/);
  assert.doesNotMatch(s,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
 }
 for(const name of ["smn_registry_item","smn_registry_item_audit","smn_registry_relation",
  "smn_registry_comment","smn_risk_assessment","smn_risk_roam"])
  assert.ok(core.includes(name),name);
 for(const name of ["smn_registry_cycle_link","smn_action_link","smn_decision_detail",
  "smn_dependency_parties","smn_dependency_vigilance","smn_fact_selection"])
  assert.ok(ext.includes(name),name);
});

test("Registres: déploiement atomique unique et contrôles structurels après migration",()=>{
 const script=read("scripts/apply-registry-schema-v32.ts");
 assert.match(script,/registryCoreStatements/);
 assert.match(script,/registryExtensionStatements/);
 assert.match(script,/outcomeDDL/);
 assert.match(script,/pg_advisory_xact_lock/);
 assert.match(script,/BEGIN/);
 assert.match(script,/COMMIT/);
 assert.match(script,/ROLLBACK/);
 assert.match(script,/smn_calendar_meeting_outcome_link/);
 assert.match(script,/smn_registry_item_team_type_date/);
 assert.match(script,/smn_registry_comment_item_date/);
 assert.doesNotMatch(script,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
});
