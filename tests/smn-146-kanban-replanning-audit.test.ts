import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {inspectDateChange} from "../src/server/kanban/date-correction";
describe("SMN-146 — audit des replanifications",()=>{
 const period={id:"cycle-a",name:"Période A",startOn:"2026-11-01",endOn:"2026-11-30",status:"planned",timeZone:"Europe/Paris"};
 it("AC1 — conserve les dates avant/après sans mutation",()=>{
  const saved=JSON.stringify(period);
  const preview=inspectDateChange(period,"2026-11-02","2026-11-29",[]);
  assert.deepEqual(preview.before,{startOn:"2026-11-01",endOn:"2026-11-30"});
  assert.deepEqual(preview.after,{startOn:"2026-11-02",endOn:"2026-11-29"});
  assert.equal(JSON.stringify(period),saved);
 });
 it("AC2/AC4 — préserve les événements et signale les conflits",()=>{
  const other={...period,id:"cycle-b",startOn:"2026-11-25",endOn:"2026-12-15"};
  const preview=inspectDateChange(period,"2026-11-02","2026-12-01",[other]);
  assert.equal(preview.events,"preserve");
  assert.equal(preview.capacity,"unchanged");
  assert.equal(preview.canConfirm,false);
  assert.deepEqual(preview.conflicts,["cycle-b"]);
 });
});
