import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {kanbanReportSections,selectKanbanReportSections} from "../src/server/kanban/report-preparation";
describe("SMN-158 — préparation rapport Kanban",()=>{
 it("AC2 — n'introduit aucun Story Point",()=>{
  assert.deepEqual(kanbanReportSections,["objectives","flow","timing","capacity","trends"]);
  assert.equal(kanbanReportSections.includes("storyPoints" as never),false);
 });
 it("AC2/AC4 — filtre les rubriques sans mutation ni export",()=>{
  assert.deepEqual(selectKanbanReportSections(["timing","objectives","unknown"]),["objectives","timing"]);
  assert.deepEqual(selectKanbanReportSections([]),[]);
 });
});
