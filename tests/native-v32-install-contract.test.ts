import {test} from "node:test";
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
