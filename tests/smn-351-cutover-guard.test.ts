import {test} from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const script=readFileSync("scripts/smn-351-legacy-audit.ts","utf8");
const plan=readFileSync("_bmad-output/planning-artifacts/SMN-351-INVENTAIRE-CUTOVER.md","utf8");
test("SMN-351 audit remains read-only and fail-closed before destructive cutover",()=>{
 assert.match(script,/BEGIN READ ONLY/);
 assert.match(script,/destructiveOperationExecuted:false/);
 assert.doesNotMatch(script,/db\.query\(\s*["`']\s*(?:DROP|DELETE|TRUNCATE|ALTER|UPDATE|INSERT)\b/i);
 assert.match(script,/schemaVersion!==33/);
});
test("SMN-351 inventory distinguishes legacy candidates and protected business datasets",()=>{
 for(const key of ["smn_indicator_definition","smn_sprint_closure_snapshot","smn_kanban_closure","smn_kanban_capacity_opening"])assert.ok(script.includes(key));
 for(const classification of ["KEEP","ADAPT","DROP"])assert.ok(plan.includes(classification));
 assert.match(plan,/essai de restauration/);
});

test("SMN-351: obsolete Fxx APIs fail closed on v33 and point to dynamic replacements",()=>{
 const routes=["story-points","tickets","scores","trends"];
 for(const route of routes){
  const source=readFileSync("src/app/api/admin/sprints/"+route+"/route.ts","utf8");
  assert.match(source,/legacyIndicatorEndpointRetired\(\)/);
  assert.match(source,/legacy-indicators-retired/);
  assert.match(source,/410/);
  assert.match(source,/authorizeApi/);
 }
 const retired=readFileSync("src/server/indicators/legacy-cutover.ts","utf8");
 assert.match(retired,/schema_version===33/);
 assert.doesNotMatch(retired,/DROP|DELETE FROM|TRUNCATE/);
});

test("SMN-351: v33 Scrum report previews omit legacy Fxx while immutable references remain untouched",()=>{
 const compose=readFileSync("src/server/reports/html-preview.ts","utf8");
 assert.match(compose,/const metrics=v33\?\[\]:legacyMetrics/);
 assert.match(compose,/trends:!v33&&/);
 assert.match(compose,/dynamicIndicators/);
 const frozen=readFileSync("src/server/reports/render-reference.ts","utf8");
 assert.match(frozen,/canonicalJson\(payload\)/);
});
