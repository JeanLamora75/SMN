import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const routes=[
 "src/app/api/team-calendar/meetings/route.ts",
 "src/app/api/team-calendar/periods/route.ts",
 "src/app/api/admin/sprints/lunch/route.ts",
] as const;

test("calendrier et pause déjeuner utilisent le contrat central",()=>{
 for(const route of routes){
  const source=readFileSync(new URL("../"+route,import.meta.url),"utf8");
  assert.match(source,/evaluateSchemaCapability/);
  assert.match(source,/resolveAdminTeam/);
  assert.doesNotMatch(source,/version>=28&&version<=32/);
  assert.doesNotMatch(source,/schema_version>=28&&.*schema_version<=32/);
 }
});

test("les parcours monoéquipe historiques conservent un chemin séparé",()=>{
 for(const route of routes){
  const source=readFileSync(new URL("../"+route,import.meta.url),"utf8");
  assert.match(source,/27/);
 }
});
