import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {nextClosureVersion} from "../src/server/kanban/closure";
import {calendarState} from "../src/server/kanban/states";
describe("SMN-155 — clôtures Kanban versionnées",()=>{
 it("AC1 — fin calendaire sans clôture automatique",()=>{
  assert.equal(calendarState("active","2026-10-01","2026-10-20","2026-10-24"),"finished");
  assert.equal(calendarState("closed","2026-10-01","2026-10-20","2026-10-24"),"closed");
 });
 it("AC3/AC5 — chaque clôture obtient une nouvelle version",()=>{
  assert.equal(nextClosureVersion([]),1);
  assert.equal(nextClosureVersion([1]),2);
  assert.equal(nextClosureVersion([1,2,3]),4);
 });
});
