import test from "node:test";
import assert from "node:assert/strict";
import {SCHEMA_TARGET,PROFILES,plan} from "../scripts/validate-version.mjs";

test("la version cible est v33 et les profils disposent de commandes",()=>{
 assert.equal(SCHEMA_TARGET,33);
 for(const steps of Object.values(PROFILES)) assert.ok(steps.length>0);
});
test("les profils PostgreSQL exigent une URL explicite",()=>{
 assert.throws(()=>plan("smn-348",{}),/PostgreSQL/);
 assert.deepEqual(plan("smn-348",{SMN_TEST_DATABASE_URL:"postgresql://test"}),PROFILES["smn-348"]);
});
test("les profils inconnus sont refusés sans lancer de tests",()=>{
 assert.throws(()=>plan("unknown",{}),/Profil inconnu/);
});
test("le profil de qualité fonctionne sans base et reste déterministe",()=>{
 assert.deepEqual(plan("quality",{}),["i18n:check","typecheck","lint"]);
});
