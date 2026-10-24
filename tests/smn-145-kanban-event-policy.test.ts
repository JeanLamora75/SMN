import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {movableKanbanOccurrence,inspectKanbanEvents,type KanbanOccurrence} from "../src/server/kanban/event-policy";
const upcoming:KanbanOccurrence={id:"generated",startsAt:"2026-11-15T09:00:00Z",endsAt:"2026-11-15T09:30:00Z",status:"planned",origin:"generated",customized:false};
describe("SMN-145 — protections des occurrences Kanban",()=>{
 it("AC2 — seule une occurrence future standard non personnalisée est éligible",()=>{
  assert.equal(movableKanbanOccurrence(upcoming,"2026-10-24T10:00:00Z"),true);
  assert.equal(movableKanbanOccurrence({...upcoming,customized:true},"2026-10-24T10:00:00Z"),false);
 });
 it("AC3 — préserve tenue, non tenue et annulée",()=>{
  for(const status of ["held","not-held","cancelled"])assert.equal(movableKanbanOccurrence({...upcoming,status},"2026-10-24T10:00:00Z"),false);
 });
 it("AC4 — exceptions et occurrences manuelles protégées",()=>{
  for(const origin of ["manual","exceptional"] as const)assert.equal(movableKanbanOccurrence({...upcoming,origin},"2026-10-24T10:00:00Z"),false);
 });
 it("AC1 — avertit pour les événements hors des bornes après correction",()=>{
  const result=inspectKanbanEvents([upcoming],"2026-11-01","2026-11-10","2026-10-24T10:00:00Z");
  assert.deepEqual(result.outside,["generated"]);
 });
});
