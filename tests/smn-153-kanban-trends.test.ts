import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {selectKanbanTrends,type TrendPeriod} from "../src/server/kanban/trends";
const items:TrendPeriod[]=Array.from({length:8},(_,i)=>({id:"p"+i,name:"P"+i,startOn:`2026-${String(i+1).padStart(2,"0")}-01`,endOn:`2026-${String(i+1).padStart(2,"0")}-28`,status:"closed",started:i===3?null:i,throughput:i+1,wipFinal:0}));
describe("SMN-153 — tendances de flux Kanban",()=>{
 it("AC1/AC2 — retient au plus cinq périodes clôturées en ordre chronologique",()=>{
  const result=selectKanbanTrends(items,{startOn:"2026-08-01",id:"p7"});
  assert.equal(result.length,5);
  assert.deepEqual(result.map(p=>p.id),["p3","p4","p5","p6","p7"]);
 });
 it("AC3 — exclut les périodes postérieures",()=>{
  assert.deepEqual(selectKanbanTrends(items,{startOn:"2026-04-01",id:"p3"}).map(p=>p.id),["p0","p1","p2","p3"]);
 });
 it("AC4 — préserve null et zéro sans interpolation",()=>{
  const result=selectKanbanTrends(items,{startOn:"2026-08-01",id:"p7"});
  assert.equal(result[0].started,null);
  assert.equal(result[0].wipFinal,0);
 });
 it("AC5 — pas d’historique clôturé, pas de point",()=>{
  assert.deepEqual(selectKanbanTrends(items.map(x=>({...x,status:"active"})),{startOn:"2026-08-01",id:"p7"}),[]);
 });
});
