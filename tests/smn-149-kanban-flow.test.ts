import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseFlowCounts} from "../src/server/kanban/flow-counts";
describe("SMN-149 — comptages de flux Kanban",()=>{
 it("AC1 — accepte trois comptes entiers indépendants",()=>{
  assert.deepEqual(parseFlowCounts({started:2,throughput:8,wipFinal:3}),{started:2,throughput:8,wipFinal:3});
 });
 it("AC2 — Throughput peut dépasser le nombre commencé",()=>{
  assert.equal(parseFlowCounts({started:1,throughput:12,wipFinal:4})?.throughput,12);
 });
 it("AC3/AC4 — distingue inconnu, zéro et encours final",()=>{
  assert.deepEqual(parseFlowCounts({started:null,throughput:0,wipFinal:null}),{started:null,throughput:0,wipFinal:null});
  assert.deepEqual(parseFlowCounts({started:0,throughput:0,wipFinal:0}),{started:0,throughput:0,wipFinal:0});
 });
 it("AC5 — rejette négatifs, fractions, chaînes et valeurs déduites",()=>{
  for(const value of [-1,1.5,"2",NaN,Infinity])assert.equal(parseFlowCounts({started:value,throughput:0,wipFinal:null}),null);
  assert.equal(parseFlowCounts({started:1,throughput:2}),null);
 });
});
