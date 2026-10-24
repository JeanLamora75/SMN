import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {safeKanbanGap} from "../src/server/kanban/capacity-view";
describe("SMN-152 — écarts fiables de capacité Kanban",()=>{
 it("AC2 — un écart n'est pas calculé pour une période future",()=>{
  assert.equal(safeKanbanGap(5,7,"planned"),null);
  assert.equal(safeKanbanGap(5,7,"active"),null);
 });
 it("AC3 — seuls les écarts de cycles terminés ou clôturés sont consolidés",()=>{
  assert.equal(safeKanbanGap(5,7,"finished"),2);
  assert.equal(safeKanbanGap(8,5.5,"closed"),-2.5);
 });
 it("AC4 — les valeurs absentes ne deviennent jamais zéro",()=>{
  assert.equal(safeKanbanGap(null,0,"finished"),null);
  assert.equal(safeKanbanGap(0,null,"finished"),null);
  assert.equal(safeKanbanGap(0,0,"finished"),0);
 });
});
