import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {inspectDateChange} from "../src/server/kanban/date-correction";
const current={id:"p1",name:"Cycle A",startOn:"2026-11-01",endOn:"2026-11-30",status:"planned",timeZone:"Europe/Paris"};
describe("SMN-144 — correction de dates Kanban",()=>{
 it("AC1/AC3 — propose le changement en préservant les événements et capacités",()=>{
  const result=inspectDateChange(current,"2026-11-02","2026-11-25",[]);
  assert.equal(result.canConfirm,true);
  assert.equal(result.events,"preserve");
  assert.equal(result.capacity,"unchanged");
  assert.deepEqual(result.before,{startOn:"2026-11-01",endOn:"2026-11-30"});
 });
 it("AC2 — bloque tout chevauchement, pas la contiguïté",()=>{
  const other={...current,id:"p2",startOn:"2026-12-01",endOn:"2026-12-31"};
  assert.deepEqual(inspectDateChange(current,"2026-11-15","2026-12-02",[other]).conflicts,["p2"]);
  assert.equal(inspectDateChange(current,"2026-11-15","2026-11-30",[other]).canConfirm,true);
 });
 it("AC4 — l’aperçu n’a aucun effet sur les périodes sources",()=>{
  const snapshot=JSON.stringify(current);
  inspectDateChange(current,"2026-11-15","2026-11-30",[]);
  assert.equal(JSON.stringify(current),snapshot);
 });
 it("AC2 — rejette les dates invalides",()=>{
  assert.equal(inspectDateChange(current,"2026-02-30","2026-03-15",[]).canConfirm,false);
  assert.equal(inspectDateChange(current,"2026-11-30","2026-11-01",[]).canConfirm,false);
 });
});
