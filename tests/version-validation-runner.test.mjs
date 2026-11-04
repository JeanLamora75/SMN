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

test("les profils ciblés ne dupliquent pas les contrôles qualité communs",()=>{
 const env={SMN_TEST_DATABASE_URL:"postgresql://test"};
 for(const profile of ["smn-348","smn-349","smn-350","smn-351"]){
  const scoped=plan(profile,env,"feature");
  assert.ok(scoped.length>0,profile+" : tests métier obligatoires");
  assert.ok(scoped.every(step=>!["i18n:check","typecheck","lint"].includes(step)),profile);
  assert.deepEqual(scoped,PROFILES[profile].filter(step=>!["i18n:check","typecheck","lint"].includes(step)));
  assert.deepEqual(plan(profile,env),PROFILES[profile]);
 }
});

test("le périmètre ciblé ne peut pas contourner la qualité ou les migrations",()=>{
 assert.throws(()=>plan("quality",{},"feature"),/Périmètre de validation invalide/);
 assert.throws(()=>plan("migration-v33",{SMN_TEST_DATABASE_URL:"postgresql://test"},"feature"),/Périmètre de validation invalide/);
 assert.throws(()=>plan("smn-348",{},"feature"),/PostgreSQL/);
 assert.throws(()=>plan("smn-351",{},"invalid"),/Périmètre de validation invalide/);
});

test("le profil qualité centralisé conserve chaque garde obligatoire",()=>{
 assert.deepEqual(plan("quality",{}),["i18n:check","typecheck","lint"]);
});
