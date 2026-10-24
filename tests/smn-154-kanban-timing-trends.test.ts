import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {selectTimingTrends} from "../src/server/kanban/trends";
import {formatTiming} from "../src/server/kanban/timing";
describe("SMN-154 — comparaison des deux moyennes",()=>{
 const periods=Array.from({length:7},(_,i)=>({
  id:"p"+i,name:"P"+i,startOn:"2026-"+String(i+1).padStart(2,"0")+"-01",
  status:"closed",cycleDays:i===4?null:i,leadDays:i===5?null:i+0.555
 }));
 it("AC2 — au plus cinq périodes closes, sans futur",()=>{
  const items=selectTimingTrends(periods,{startOn:"2026-06-01",id:"p5"});
  assert.deepEqual(items.map(x=>x.id),["p1","p2","p3","p4","p5"]);
 });
 it("AC3 — lacunes indépendantes sans valeur inventée",()=>{
  const items=selectTimingTrends(periods,{startOn:"2026-06-01",id:"p5"});
  assert.equal(items[3].cycleDays,null);
  assert.equal(items[3].leadDays,4.555);
  assert.equal(items[4].leadDays,null);
 });
 it("AC4/AC5 — zéro vs null, une décimale FR/EN",()=>{
  assert.equal(formatTiming(0,"fr"),"0,0");
  assert.equal(formatTiming(0,"en"),"0.0");
  assert.equal(formatTiming(null,"fr"),"—");
 });
});
