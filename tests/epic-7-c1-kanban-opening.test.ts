import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {calendarState} from "../src/server/kanban/states";

describe("Epic 7 C1 — ouverture et transitions Kanban",()=>{
 it("une période future reste planifiée sans photographie réelle",()=>{
  assert.equal(calendarState("planned","2026-11-01","2026-11-30","2026-10-24"),"planned");
 });
 it("l'ouverture du premier jour produit une période en cours",()=>{
  assert.equal(calendarState("planned","2026-10-24","2026-10-31","2026-10-24"),"active");
 });
 it("une ouverture découverte rétrospectivement ne doit pas devenir une ouverture à l'heure",()=>{
  assert.equal(calendarState("planned","2026-10-01","2026-10-20","2026-10-24"),"finished");
 });
 it("une période clôturée demeure clôturée",()=>{
  assert.equal(calendarState("closed","2026-10-01","2026-10-20","2026-10-24"),"closed");
 });
});
