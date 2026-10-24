import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {inspectDateChange} from "../src/server/kanban/date-correction";
const period={id:"period-a",name:"Octobre",startOn:"2026-10-01",endOn:"2026-10-31",status:"active",timeZone:"Europe/Paris"};
describe("Epic 7 C4 — bornes de replanification",()=>{
 it("détecte un chevauchement sans autoriser la confirmation",()=>{
  const result=inspectDateChange(period,"2026-11-01","2026-11-30",[{...period,id:"period-b",startOn:"2026-11-15",endOn:"2026-12-15"}]);
  assert.equal(result.canConfirm,false);
  assert.deepEqual(result.conflicts,["period-b"]);
 });
 it("préserve la politique des événements enregistrés",()=>{
  const result=inspectDateChange(period,"2026-10-05","2026-10-30",[]);
  assert.equal(result.canConfirm,true);
  assert.equal(result.events,"preserve");
 });
 it("rejette les dates inexistantes",()=>{
  assert.equal(inspectDateChange(period,"2026-02-30","2026-03-30",[]).canConfirm,false);
 });
});
