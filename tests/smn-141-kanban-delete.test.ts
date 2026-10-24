import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {deletionEligibility} from "../src/server/kanban/delete";
describe("SMN-141 — protection de suppression Kanban",()=>{
 it("AC1/AC4 — seulement une période future planifiée jamais démarrée",()=>{
  assert.equal(deletionEligibility("planned","2026-11-05","2026-10-24",false),true);
  assert.equal(deletionEligibility("planned","2026-10-24","2026-10-24",false),false);
  assert.equal(deletionEligibility("planned","2026-10-23","2026-10-24",false),false);
 });
 it("AC3 — états historiques et démarrage effectif bloquent",()=>{
  for(const status of ["active","started","completed","closed","finished"])
   assert.equal(deletionEligibility(status,"2026-11-05","2026-10-24",false),false);
  assert.equal(deletionEligibility("planned","2026-11-05","2026-10-24",true),false);
 });
});
