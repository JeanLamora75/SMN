import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {kanbanBounds,parseKanbanCadence} from "../src/server/kanban/cadence";

describe("SMN-136 — cadence Kanban",()=>{
 it("AC1/AC3 — couvre les mois civils y compris février bissextile",()=>{
  assert.deepEqual(kanbanBounds("2026-10-24","monthly"),{startOn:"2026-10-01",endOn:"2026-10-31"});
  assert.deepEqual(kanbanBounds("2026-02-11","monthly"),{startOn:"2026-02-01",endOn:"2026-02-28"});
  assert.deepEqual(kanbanBounds("2028-02-11","monthly"),{startOn:"2028-02-01",endOn:"2028-02-29"});
 });
 it("AC2 — 7 et 14 jours calendaires, lundi ou jour configuré",()=>{
  assert.deepEqual(kanbanBounds("2026-10-29","weekly"),{startOn:"2026-10-26",endOn:"2026-11-01"});
  assert.deepEqual(kanbanBounds("2026-10-29","biweekly"),{startOn:"2026-10-26",endOn:"2026-11-08"});
  assert.deepEqual(kanbanBounds("2026-10-29","weekly",3),{startOn:"2026-10-28",endOn:"2026-11-03"});
 });
 it("AC4 — changement d'heure sans décalage de date",()=>{
  assert.deepEqual(kanbanBounds("2027-03-28","weekly"),{startOn:"2027-03-22",endOn:"2027-03-28"});
  assert.deepEqual(kanbanBounds("2027-10-31","weekly"),{startOn:"2027-10-25",endOn:"2027-10-31"});
 });
 it("AC5 — refuse les cadences personnalisées",()=>{
  const base={frequency:"monthly",startDay:1,timeZone:"Europe/Paris",revision:1};
  assert.deepEqual(parseKanbanCadence(base),base);
  assert.equal(parseKanbanCadence({...base,frequency:"10-days"}),null);
  assert.equal(parseKanbanCadence({...base,startDay:0}),null);
  assert.equal(parseKanbanCadence({...base,timeZone:"Invalid/Zone"}),null);
 });
});
