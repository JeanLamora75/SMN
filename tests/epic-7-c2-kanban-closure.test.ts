import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {nextClosureVersion} from "../src/server/kanban/closure";
import {safeKanbanGap} from "../src/server/kanban/capacity-view";
describe("Epic 7 C2 — instantanés versionnés de clôture",()=>{
 it("une réouverture suivie d'une nouvelle clôture n'écrase pas V1",()=>{
  assert.equal(nextClosureVersion([]),1);
  assert.equal(nextClosureVersion([1]),2);
  assert.equal(nextClosureVersion([1,2]),3);
 });
 it("la capacité conservée distingue absence et zéro",()=>{
  assert.equal(safeKanbanGap(null,3,"closed"),null);
  assert.equal(safeKanbanGap(0,0,"closed"),0);
 });
});
