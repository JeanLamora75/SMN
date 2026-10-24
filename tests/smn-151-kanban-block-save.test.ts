import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseMetricsDraft} from "../src/server/kanban/metrics-block";
const timing={cycle:{days:2.5,convention:"calendar",source:"manuel"},lead:{days:null,convention:"unknown",source:""}};
describe("SMN-151 — sauvegarde indépendante du bloc Métriques",()=>{
 it("AC1 — accepte exactement les cinq métriques du bloc",()=>{
  const data=parseMetricsDraft({counts:{started:2,throughput:5,wipFinal:0},timing});
  assert.deepEqual(data?.counts,{started:2,throughput:5,wipFinal:0});
  assert.equal(data?.timing.cycle.days,2.5);
 });
 it("AC1 — refuse les objectifs ou capacités mélangés au bloc",()=>{
  assert.equal(parseMetricsDraft({counts:{started:2,throughput:5,wipFinal:0},timing,objectives:[]}),null);
  assert.equal(parseMetricsDraft({counts:{started:2,throughput:5,wipFinal:0},timing,capacity:5}),null);
 });
 it("AC2/AC3 — zéro et absence restent distincts; aucune dérivation",()=>{
  const x=parseMetricsDraft({counts:{started:null,throughput:0,wipFinal:null},timing});
  assert.equal(x?.counts.started,null);
  assert.equal(x?.counts.throughput,0);
  assert.equal(x?.counts.wipFinal,null);
 });
});
