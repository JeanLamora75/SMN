import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const component=readFileSync(
 new URL("../src/app/app/admin/registries/registry-create.tsx",import.meta.url),"utf8"
);

test("les actions de decision et de risque exigent un identifiant equipe",()=>{
 assert.match(component,/\{teamId&&<DecisionActions id=\{itemId\} teamId=\{teamId\}/);
 assert.match(component,/\{teamId&&<MaterializeRisk id=\{itemId\} teamId=\{teamId\}/);
});

test("la consultation des details reste possible sans contexte equipe",()=>{
 assert.match(component,/type==="decision"&&<><DecisionDetail /);
 assert.match(component,/type==="risk"&&<><RiskRoam /);
 assert.match(component,/<RiskAssessment id=\{itemId\}/);
});
