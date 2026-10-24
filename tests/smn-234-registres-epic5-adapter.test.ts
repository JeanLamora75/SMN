import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {readSprintRegisters} from "../src/server/sprints/registers-detail-read";
import {readEpic5SprintRegisterSource,qualitativeSnapshotSource}
 from "../src/server/registries/sprint-adapter";
import {registerKinds} from "../src/lib/sprint-registers";

const sprint={id:"123e4567-e89b-42d3-a456-426614174000",
 startAt:"2026-10-26T08:00:00.000Z",endAt:"2026-11-09T00:00:00.000Z",
 timeZone:"Europe/Paris"};
const team="team-a";
const iso=(x:string)=>new Date(x).toISOString();
const item=(id:string,type:string,when:string,extras:Record<string,unknown>={})=>({
 id,type,title:type+"-"+id,status:type==="highlight"?"recorded":"open",
 openedAt:iso(when),date:iso(when),closedAt:null,sprintIds:[],
 priority:null,...extras
});
function fake(fn:(sql:string,params?:readonly unknown[])=>{rows:unknown[]}){
 const queries:{sql:string;params?:readonly unknown[]}[]=[];
 return {db:{query:async(sql:string,params?:readonly unknown[])=>{
  queries.push({sql,params});return fn(sql,params);
 }} as unknown as Client,queries};
}
describe("SMN-234 — raccordement Epic 5 des six registres",()=>{
 it("la liste courante lit les types réels de la bonne équipe sans mutation",async()=>{
  const f=fake(sql=>
   sql.includes("SELECT s.status")?{rows:[{status:"active"}]}:
   sql.includes("to_regclass")?{rows:[{items:true,links:true,audit:true,assess:true,
    automatic:false,selection:false,invalidated:false}]}:
   sql.includes("FROM public.smn_registry_item r")?
    {rows:[item("r1","risk","2026-10-29T09:00:00Z",{priority:"high",
     sprintIds:[sprint.id]}),item("d1","decision","2026-10-30T09:00:00Z"),
     item("h1","highlight","2026-11-02T09:00:00Z")]}:
   {rows:[]});
  const result=await readSprintRegisters(f.db,team,sprint,1,readEpic5SprintRegisterSource);
  assert.equal(result?.state,"available");
  if(result?.state==="available"){
   assert.equal(result.total,3);
   assert.deepEqual(result.missingKinds,[]);
   assert.deepEqual(result.items.map(x=>x.kind),["risk","decision","highlight"]);
   assert.equal(result.items[0].href,"/app/admin/registries/r1");
  }
  assert.ok(f.queries.every(x=>/^\s*SELECT\b/.test(x.sql)));
  assert.ok(f.queries.some(x=>x.sql.includes("r.team_id=$1")));
 });
 it("un risque antérieur toujours actif est affiché; un risque clôturé avant est exclu",async()=>{
  const f=fake(sql=>sql.includes("to_regclass")?
   {rows:[{items:true,links:false,audit:true,assess:false,automatic:false}]}:
   {rows:[item("old","risk","2026-10-05T09:00:00Z"),
    item("closed","risk","2026-10-01T09:00:00Z",{closedAt:"2026-10-08T09:00:00.000Z"})]});
  const source=await readEpic5SprintRegisterSource(f.db,team,sprint);
  assert.equal(source.records.length,2);
  const {selectSprintRegisterPage}=await import("../src/lib/sprint-registers");
  const selected=selectSprintRegisterPage(source,team,sprint);
  assert.equal(selected?.total,1);
  assert.equal(selected?.items[0].id,"old");
 });
 it("sans table de fiches, les six registres restent indisponibles et non vides",async()=>{
  const f=fake(sql=>sql.includes("to_regclass")?
   {rows:[{items:false,links:false,audit:false,assess:false,automatic:false}]}:{rows:[]});
  const r=await readEpic5SprintRegisterSource(f.db,team,sprint);
  assert.deepEqual(r.availableKinds,[]);
  assert.equal(r.records.length,0);
 });
 it("convertit les snapshots qualitatifs effectivement écrits par SMN-111",async()=>{
  const value={state:"captured",items:[{
   id:"risk1",type:"risk",title:"Dépendance critique",status:"resolved",
   occurredOn:"2026-10-20",createdAt:"2026-10-20T10:00:00.000Z"
  },{
   id:"dec1",type:"decision",title:"Décider",status:"active",
   occurredOn:"2026-10-28",createdAt:"2026-10-28T10:00:00.000Z"
  }],facts:[{
   id:"auto1",origin:"automatic",title:"Risque critique",
   effectiveOn:"2026-10-28",recordedAt:"2026-10-28T10:00:00.000Z"
  }]};
  const source=qualitativeSnapshotSource(value,team,sprint);
  assert.ok(source);
  assert.deepEqual(source?.availableKinds,[...registerKinds]);
  const f=fake(sql=>
   sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:2,snapshot:{qualitative:value}}]});
  const response=await readSprintRegisters(f.db,team,sprint);
  assert.equal(response?.state,"available");
  if(response?.state==="available"){
   assert.equal(response.source,"closure-snapshot");
   assert.equal(response.snapshotVersion,2);
   assert.equal(response.total,3);
   assert.ok(response.items.every(x=>x.href===null));
  }
  assert.ok(!f.queries.some(x=>x.sql.includes("smn_registry_item")));
 });
 it("snapshot historique absent : aucune reconstitution avec les fiches actuelles",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:1,snapshot:{goals:[]}}]});
  assert.deepEqual(await readSprintRegisters(f.db,team,sprint),
   {state:"unavailable",reason:"history-missing"});
  assert.equal(f.queries.length,3);
 });
});
