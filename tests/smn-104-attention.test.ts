import test from "node:test";
import assert from "node:assert/strict";
import {riskAttention} from "../src/server/registries/attention";
import {deadlineState} from "../src/lib/registry-deadlines";
test("risque élevé uniquement hors ROAM Resolved",()=>{
 assert.equal(riskAttention(3,3,"resolved"),false);
 assert.equal(riskAttention(3,3,"owned"),true);
 assert.equal(riskAttention(null,3,"owned"),false);
 assert.equal(riskAttention(1,2,"mitigated"),false);
});
test("échéances : jamais de faux retard sur objets clos ou dates absentes",()=>{
 assert.equal(deadlineState("action","completed","2026-10-20","2026-10-23"),null);
 assert.equal(deadlineState("dependency","satisfied","2026-10-20","2026-10-23"),null);
 assert.equal(deadlineState("action","todo",null,"2026-10-23"),null);
 assert.equal(deadlineState("dependency","open","2026-10-22","2026-10-23"),"overdue");
});
