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
