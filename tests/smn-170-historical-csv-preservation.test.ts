import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {defaultCsvDecision,resolveCsvDecision,isProtectedCsvTarget} from "../src/lib/historical-csv-preservation";
describe("SMN-170 — preservation des valeurs préexistantes",()=>{
 it("conserve 17 face à une proposition à zéro sans remplacement explicite",()=>{
  assert.equal(defaultCsvDecision(17),"keep");
  assert.deepEqual(resolveCsvDecision(17,0),{decision:"keep",resultingValue:17});
 });
 it("distingue zéro attesté et absence de donnée",()=>{
  assert.deepEqual(resolveCsvDecision(null,0),{decision:"insert",resultingValue:0});
  assert.deepEqual(resolveCsvDecision(0,5),{decision:"keep",resultingValue:0});
 });
 it("n'autorise un remplacement que volontaire",()=>{
  assert.deepEqual(resolveCsvDecision(17,0,true),{decision:"replace",resultingValue:0});
 });
 it("exclut les capacités et les métriques dérivées",()=>{
  for(const code of ["CAPACITY_JH","SP_FINAL","VELOCITY","FLOW_EFFICIENCY"])
   assert.equal(isProtectedCsvTarget(code),true);
 });
});
