import {test} from "node:test";
import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
import {validateExpressInput} from "../src/server/installation/contract";
import {nativeBaselineReady} from "../src/server/installation/install";

const valid={adminUsername:"admin",adminEmail:"admin@example.test",password:"secretpass"};
test("l'installation ne demande plus de mode Agile ni d'équipe",()=>{
 assert.deepEqual(validateExpressInput(valid),valid);
 assert.deepEqual(validateExpressInput({...valid,mode:"kanban",team:"Équipe test"}),valid);
 assert.equal(validateExpressInput({...valid,password:""}),null);
});
test("un schéma v1 n'est jamais accepté comme baseline v32",()=>{
 const old='CREATE TABLE public.smn_installation (id text, mode text NOT NULL); CREATE TABLE public.smn_account (id text); CREATE TABLE public.smn_team (agile_mode text);';
 assert.equal(nativeBaselineReady(old),false);
 assert.equal(nativeBaselineReady(""),false);
});

test("la baseline v32 ne réintroduit pas de mode global et conserve le mode par équipe",()=>{
 const sql=readFileSync(new URL("../prisma/baseline/v32/schema.sql",import.meta.url),"utf8");
 const installation=sql.match(/CREATE TABLE "public"\."smn_installation" \(([\s\S]*?)\n\);/);
 assert.ok(installation,"table d'installation manquante");
 assert.doesNotMatch(installation[1],/"mode"\s+"text"/);
 assert.doesNotMatch(sql,/smn_installation_mode_check/);
 const team=sql.match(/CREATE TABLE "public"\."smn_team" \(([\s\S]*?)\n\);/);
 assert.ok(team,"table équipe manquante");
 assert.match(team[1],/"agile_mode"\s+"text"/);
});
