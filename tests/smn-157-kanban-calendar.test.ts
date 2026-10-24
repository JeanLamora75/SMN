import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {calendarState} from "../src/server/kanban/states";
describe("SMN-157 — calendrier des périodes Kanban",()=>{
 it("AC1 — statuts Kanban préservés et indépendants du vocabulaire Scrum",()=>{
  assert.equal(calendarState("planned","2026-11-01","2026-11-30","2026-10-24"),"planned");
  assert.equal(calendarState("active","2026-10-01","2026-10-31","2026-10-24"),"active");
  assert.equal(calendarState("closed","2026-09-01","2026-09-30","2026-10-24"),"closed");
 });
});
