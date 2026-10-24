import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
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
 it("les six catégories réelles disposent de liens et le filtre agit avant la pagination",async()=>{
  const types=["risk","obstacle","dependency","decision","action","highlight"];
  const f=fake(sql=>sql.includes("to_regclass")?
   {rows:[{items:true,links:false,audit:true,assess:false,automatic:false}]}:
   {rows:types.map((type,i)=>item("id"+i,type,"2026-10-29T09:00:00Z"))});
  const all=await readSprintRegisters(f.db,team,sprint,1,readEpic5SprintRegisterSource);
  assert.equal(all?.state,"available");
  if(all?.state==="available"){
   assert.equal(all.total,6);
   assert.deepEqual(new Set(all.items.map(x=>x.kind)),new Set(types));
  }
  const action=await readSprintRegisters(f.db,team,sprint,1,readEpic5SprintRegisterSource,"action");
  assert.equal(action?.state,"available");
  if(action?.state==="available"){
   assert.equal(action.total,1);
   assert.equal(action.items[0].kind,"action");
  }
  const sql=f.queries.find(x=>x.sql.includes("FROM public.smn_registry_item r"))!;
  assert.deepEqual(sql.params,[team,"Europe/Paris"]);
  assert.match(sql.sql,/AT TIME ZONE \$2/);
  assert.doesNotMatch(sql.sql,/AT TIME ZONE \$3/);
 });
 it("les faits automatiques sont issus des fiches ou d'objectifs du Sprint",async()=>{
  const f=fake(sql=>
   sql.includes("to_regclass")?{rows:[{items:true,links:true,audit:false,assess:false,
    automatic:true,selection:true,invalidated:true,goals:true}]}:
   sql.includes("FROM public.smn_registry_item r")?
    {rows:[]}:
   sql.includes("h.source_kind='registry'")?
    {rows:[{id:"highlight1",title:"Risque élevé",
     date:"2026-10-29T09:00:00Z",sprintIds:[sprint.id]}]}:
   sql.includes("h.source_kind='goal'")?
    {rows:[{id:"highlight2",title:"Objectif atteint",
     date:"2026-10-30T09:00:00Z",sprintIds:[sprint.id]}]}:{rows:[]});
  const r=await readSprintRegisters(f.db,team,sprint,1,readEpic5SprintRegisterSource,"highlight");
  assert.equal(r?.state,"available");
  if(r?.state==="available"){
   assert.equal(r.total,2);
   assert.ok(r.items.every(x=>x.kind==="highlight"&&x.href===null));
  }
  assert.ok(f.queries.some(x=>x.sql.includes("h.invalidated_at IS NULL")));
  assert.ok(f.queries.some(x=>x.sql.includes("COALESCE(fs.hidden,false)=false")));
  assert.ok(f.queries.some(x=>x.sql.includes("AND sp.id=$2")));
 });
 it("la nouvelle interface conserve une liste navigable et ne mentionne plus un Epic 5 non développé",()=>{
  const {readFileSync}=require("node:fs");
  const content=readFileSync(new URL("../src/app/app/admin/sprints/[sprintId]/sprint-registers-panel.tsx",import.meta.url),"utf8");
  const page=readFileSync(new URL("../src/app/app/admin/sprints/[sprintId]/page.tsx",import.meta.url),"utf8");
  const fr=JSON.parse(readFileSync(new URL("../src/i18n/fr.json",import.meta.url),"utf8"));
  assert.match(content,/registersAll/);
  assert.match(content,/aria-current=\{selectedKind===kind/);
  assert.match(content,/safeRegisterHref\(item.href\)/);
  assert.match(page,/readEpic5SprintRegisterSource,registerKind/);
  assert.doesNotMatch(fr.sprintDetail.registersProducerPending,/pas encore développés/);
 });

});
