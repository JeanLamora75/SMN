import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveCsvDecision} from "../src/lib/historical-csv-preservation";
describe("SMN-171 — confirmation explicite des remplacements",()=>{
 it("conserve toute métrique non choisie, même si le CSV fournit zéro",()=>{
  assert.deepEqual(resolveCsvDecision(17,0),{decision:"keep",resultingValue:17});
  assert.deepEqual(resolveCsvDecision(17,0,true),{decision:"replace",resultingValue:0});
 });
 it("n'altère ni snapshot de clôture ni PDF dans la transaction CSV",()=>{
  const src=readFileSync("src/server/historical-csv/confirm.ts","utf8");
  assert.doesNotMatch(src,/INSERT INTO public\.smn_sprint_closure_snapshot|UPDATE public\.smn_sprint_closure_snapshot|\.pdf/i);
  assert.match(src,/closed-or-missing-cycle/);
  assert.match(src,/ROLLBACK/);
  assert.match(src,/smn_historical_csv_change/);
 });
 it("l'import demande explicitement une confirmation utilisateur",()=>{
  const src=readFileSync("src/app/app/admin/historical-csv/template-view.tsx","utf8");
  assert.match(src,/window\.confirm/);
  assert.match(src,/confirmImport/);
 });
});
