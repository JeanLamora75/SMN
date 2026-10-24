import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {kanbanReportBlocks,reportProvisional} from "../src/server/kanban/report";
describe("SMN-147 — contrat du bilan Kanban",()=>{
 it("AC1 — quatre blocs dans l'ordre attendu",()=>{
  assert.deepEqual(kanbanReportBlocks,["objectives","metrics","capacity","trends"]);
 });
 it("AC3 — les états actifs et terminés restent provisoires",()=>{
  assert.equal(reportProvisional("planned"),false);
  assert.equal(reportProvisional("active"),true);
  assert.equal(reportProvisional("finished"),true);
  assert.equal(reportProvisional("closed"),false);
 });
 it("AC5 — le contrat n'ajoute pas de rubrique Scrum",()=>{
  assert.equal(kanbanReportBlocks.includes("storyPoints" as never),false);
  assert.equal(kanbanReportBlocks.includes("ceremonies" as never),false);
 });
});
