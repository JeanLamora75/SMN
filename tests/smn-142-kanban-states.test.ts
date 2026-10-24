import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {calendarState} from "../src/server/kanban/states";
describe("SMN-142 — états Kanban",()=>{
 it("AC1 — période future reste planifiée",()=>{
  assert.equal(calendarState("planned","2026-11-01","2026-11-30","2026-10-24"),"planned");
 });
 it("AC2 — atteint son premier jour local et passe active",()=>{
  assert.equal(calendarState("planned","2026-10-24","2026-10-30","2026-10-24"),"active");
 });
 it("AC3 — après le dernier jour devient terminée sans clôture automatique",()=>{
  assert.equal(calendarState("active","2026-10-01","2026-10-23","2026-10-24"),"finished");
  assert.equal(calendarState("planned","2026-10-01","2026-10-23","2026-10-24"),"finished");
  assert.equal(calendarState("closed","2026-10-01","2026-10-23","2026-10-24"),"closed");
 });
 it("AC4 — pure et idempotente pour des dates identiques",()=>{
  assert.equal(calendarState("finished","2026-10-01","2026-10-23","2026-10-24"),"finished");
  assert.equal(calendarState("active","2026-10-01","2026-10-30","2026-10-24"),"active");
 });
});
