import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {inspectDateChange} from "../src/server/kanban/date-correction";
describe("SMN-156 — replanification sans recomposition des métriques",()=>{
 const current={id:"p1",name:"Novembre",startOn:"2026-11-01",endOn:"2026-11-30",status:"finished",timeZone:"Europe/Paris"};
 it("AC1/AC3 — le moteur pur ne modifie que les dates proposées",()=>{
  const initial=JSON.stringify(current);
  const result=inspectDateChange(current,"2026-11-02","2026-11-29",[]);
  assert.equal(result.canConfirm,true);
  assert.equal(JSON.stringify(current),initial);
  assert.deepEqual(result.after,{startOn:"2026-11-02",endOn:"2026-11-29"});
 });
 it("AC2 — les avertissements n'empêchent pas une correction valide",()=>{
  const result=inspectDateChange(current,"2026-11-02","2026-11-29",[]);
  assert.deepEqual(result.conflicts,[]);
  assert.equal(result.canConfirm,true);
 });
});
