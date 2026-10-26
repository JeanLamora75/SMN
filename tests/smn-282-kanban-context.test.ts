import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {defaultKanbanPeriodId,type KanbanPeriodContextItem}
 from "../src/lib/kanban-context";
import {readKanbanPeriodContext} from "../src/server/kanban/context";

const period=(id:string,startOn:string,endOn:string,status="planned"):
 KanbanPeriodContextItem=>({
  id,name:id,startOn,endOn,status,timeZone:"Europe/Paris"
 });
const now=Date.parse("2026-10-26T12:00:00Z");

test("Kanban : période en cours avant prochaine et passée",()=>{
 const items=[period("past","2026-09-01","2026-09-30"),
  period("now","2026-10-01","2026-10-31"),
  period("future","2026-11-01","2026-11-30")];
 assert.equal(defaultKanbanPeriodId(items,now),"now");
 assert.equal(defaultKanbanPeriodId(items,Date.parse("2026-08-25T12:00:00Z")),"past");
 assert.equal(defaultKanbanPeriodId([],now),null);
});
test("Kanban : un cycle clôturé n'est pas activé par effet de bord",()=>{
 const items=[period("closed","2026-10-01","2026-10-31","closed"),
  period("future","2026-11-01","2026-11-30")];
 assert.equal(defaultKanbanPeriodId(items,now),"future");
});
test("Kanban : lecture par teamId et sans DDL ou équipe inventée",async()=>{
 const sqls:string[]=[],params:unknown[][]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  sqls.push(sql);params.push(args);
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  return {rows:[{
   id:"panda_period",name:"Panda octobre",status:"active",
   start_on:"2026-10-01",end_on:"2026-10-31",time_zone:"Europe/Paris"
  }]};
 }} as unknown as Client;
 const result=await readKanbanPeriodContext(db,"panda",now);
 assert.equal(result.defaultCycleId,"panda_period");
 assert.deepEqual(params[1],["panda"]);
 assert.ok(sqls[1].includes("k.team_id=$1"));
 assert.ok(sqls.every(q=>!q.includes("CREATE TABLE")));
});
test("Kanban : sans table, état vide sincère",async()=>{
 const db={query:async()=>({rows:[{present:false}]})} as unknown as Client;
 assert.deepEqual(await readKanbanPeriodContext(db,"panda",now),{
  items:[],defaultCycleId:null
 });
});
