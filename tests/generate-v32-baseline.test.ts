import {test} from "node:test";
import {strict as assert} from "node:assert";
import {assertBaselineSource,verifyDump} from "../scripts/generate-v32-baseline";
test("accepte seulement une installation v32 saine à 32 migrations",()=>{
 assert.doesNotThrow(()=>assertBaselineSource(32,"initialized",32,32));
 for(const args of [[31,"initialized",31,31],[32,"installation-incomplete",32,32],
  [32,"initialized",31,31],[32,"initialized",32,31]] as const)
  assert.throws(()=>assertBaselineSource(...args));
});
test("refuse les dumps incomplets ou contenant des données",()=>{
 assert.throws(()=>verifyDump("CREATE TABLE public.foo(x int);"));
 const sql='CREATE TABLE "public"."smn_installation"(); CREATE TABLE "public"."smn_team"("agile_mode" text,"is_archived" boolean); CREATE TABLE "public"."smn_account"();';
 assert.match(verifyDump(sql),/^[0-9a-f]{64}$/);
 assert.throws(()=>verifyDump(sql+" INSERT INTO x VALUES (1);"));
});
