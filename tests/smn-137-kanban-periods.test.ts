import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {nextDay,periodFromStart} from "../src/server/kanban/dates";
describe("SMN-137 — période Kanban unitaire",()=>{
 it("AC2 — suggère le lendemain de la dernière borne",()=>{
  assert.equal(nextDay("2026-10-31"),"2026-11-01");
  assert.equal(nextDay("2028-02-29"),"2028-03-01");
 });
 it("AC3 — calcule 7 et 14 jours depuis la date demandée",()=>{
  assert.deepEqual(periodFromStart("2026-10-28","weekly"),{startOn:"2026-10-28",endOn:"2026-11-03",name:"Kanban 2026-10-28 — 2026-11-03"});
  assert.equal(periodFromStart("2026-10-28","biweekly").endOn,"2026-11-10");
 });
 it("AC3 — calcule le dernier jour réel du mois",()=>{
  assert.equal(periodFromStart("2028-02-01","monthly").endOn,"2028-02-29");
  assert.equal(periodFromStart("2026-02-01","monthly").endOn,"2026-02-28");
 });
 it("AC5 — refuse une date inexistante ou un mois partiel",()=>{
  assert.throws(()=>periodFromStart("2026-02-30","weekly"));
  assert.throws(()=>periodFromStart("2026-02-10","monthly"));
 });
});
