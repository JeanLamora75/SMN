import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseIndicatorDraft} from "../src/lib/sprint-indicator-values";
import {selectCapacityKpis,writeSprintCapacityKpis,readSprintCapacityKpiView}
 from "../src/server/sprints/sprint-capacity-kpis";
import {closedSnapshotProjection} from "../src/server/dashboard/cycle-reader";

const id="123e4567-e89b-42d3-a456-426614174000";
const file=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("J/H: null, zéro explicite, décimales et valeurs hors plage",()=>{
 assert.deepEqual(parseIndicatorDraft("","jh"),{ok:true,value:null});
 assert.deepEqual(parseIndicatorDraft("0","jh"),{ok:true,value:0});
 assert.deepEqual(parseIndicatorDraft("12.125","jh"),{ok:true,value:12.125});
 for(const bad of ["-1","1e3","12.12345","NaN","Infinity"," 1","999999999"])
  assert.equal(parseIndicatorDraft(bad,"jh").ok,false,bad);
});

test("le modèle conserve strictement les champs enregistrés face aux références recalculées",()=>{
 const a=selectCapacityKpis(0,12,24,11);
 assert.equal(a.planned,0);
 assert.equal(a.actual,12);
 assert.equal(a.calculatedPlanned,24);
 const b=selectCapacityKpis(null,null,20,10);
 assert.equal(b.planned,null);assert.equal(b.actual,null);
});

function fake(handler:(sql:string,args?:unknown[])=>{rows:unknown[];rowCount?:number}){
 const calls:Array<{sql:string;args?:unknown[]}>= [];
 const db={query:async(sql:string,args?:unknown[])=>{
  calls.push({sql,args});return handler(sql,args);
 }} as unknown as Client;
 return {db,calls};
}
test("l'API enregistre un 0 J/H autorisé avec révision, audit et transaction",async()=>{
 const f=fake(sql=>sql.includes("FROM pg_class")?
  {rows:[{name:"smn_sprint_capacity_kpi"},{name:"smn_sprint_capacity_kpi_audit"}]}:
  sql.includes("SELECT s.id,s.status")?
  {rows:[{id,status:"finished"}]}:{rows:[],rowCount:1});
 const result=await writeSprintCapacityKpis(f.db,"account-1",{
  sprintId:id,revision:0,capacity:{planned:0,actual:13.5}
 });
 assert.deepEqual(result,{ok:true,revision:1});
 assert.ok(f.calls.some(x=>x.sql.includes("INSERT INTO public.smn_sprint_capacity_kpi ")));
 assert.ok(f.calls.some(x=>x.sql.includes("smn_sprint_capacity_kpi_audit")));
 assert.ok(f.calls.some(x=>x.sql==="COMMIT"));
 assert.ok(f.calls.some(x=>x.args?.includes(0)));
});
test("une valeur invalide échoue sans aucune requête SQL",async()=>{
 const f=fake(()=>({rows:[]}));
 for(const value of [-1,1e9,0.00001,"4",Number.NaN,Number.POSITIVE_INFINITY]){
  const res=await writeSprintCapacityKpis(f.db,"account-1",{
   sprintId:id,revision:0,capacity:{planned:value,actual:null}
  });
  assert.deepEqual(res,{ok:false,error:"invalid-input"});
 }
 assert.equal(f.calls.length,0);
});
test("un Sprint clôturé ne permet aucune écriture; un sprint hors périmètre non plus",async()=>{
 const closed=fake(sql=>sql.includes("SELECT s.id,s.status")?
  {rows:[{id,status:"closed"}]}:{rows:[]});
 assert.deepEqual(await writeSprintCapacityKpis(closed.db,"admin",{
  sprintId:id,revision:0,capacity:{planned:10,actual:9}
 }),{ok:false,error:"closed-period"});
 assert.ok(!closed.calls.some(x=>x.sql.includes("CREATE TABLE")));
 const absent=fake(()=>({rows:[]}));
 assert.deepEqual(await writeSprintCapacityKpis(absent.db,"admin",{
  sprintId:id,revision:0,capacity:{planned:10,actual:9}
 }),{ok:false,error:"not-found"});
});
test("conflit de révision : ni mise à jour ni écrasement",async()=>{
 const f=fake(sql=>sql.includes("FROM pg_class")?
  {rows:[{name:"smn_sprint_capacity_kpi"},{name:"smn_sprint_capacity_kpi_audit"}]}:
  sql.includes("SELECT s.id,s.status")?
  {rows:[{id,status:"active"}]}:sql.includes("SELECT planned_jh::text")?
  {rows:[{planned_jh:"18",actual_jh:"12",revision:3}]}:{rows:[]});
 assert.deepEqual(await writeSprintCapacityKpis(f.db,"admin",{
  sprintId:id,revision:2,capacity:{planned:20,actual:14}
 }),{ok:false,error:"conflict"});
 assert.equal(f.calls.some(x=>x.sql.includes("UPDATE public.smn_sprint_capacity_kpi")),false);
});
test("un sprint clôturé lit son snapshot, jamais les calculs vivants",async()=>{
 const f=fake(sql=>sql.includes("to_regclass")?{rows:[{present:true}]}:
  {rows:[{snapshot:{capacity:{initial_jh:"20",actual_jh:"17"},
   capacityKpis:{planned:"23",actual:"19"}}}]});
 const cycle={id,status:"closed",startAt:"2026-10-12T07:00:00Z",
  endAt:"2026-10-23T22:00:00Z",timeZone:"Europe/Paris"};
 const result=await readSprintCapacityKpiView(f.db,"team-1",
  cycle as Parameters<typeof readSprintCapacityKpiView>[2]);
 assert.equal(result.state,"available");
 if(result.state==="available"){
  assert.equal(result.values.planned,23);assert.equal(result.values.actual,19);
  assert.equal(result.values.calculatedPlanned,null);
 }
 assert.ok(f.calls.every(x=>!x.sql.includes("smn_capacity_actual_override")));
});
test("le tableau de bord reflète le snapshot figé des deux KPI",()=>{
 const snap=closedSnapshotProjection({
  capacity:{initial_jh:"23",actual_jh:"19"},goals:[],storyPoints:null,
  ticketCounts:null,confidenceClarity:null
 },2);
 assert.equal(snap.capacity.initialJh.state,"available");
 if(snap.capacity.initialJh.state==="available")
  assert.equal(snap.capacity.initialJh.value,23);
 if(snap.capacity.actualJh.state==="available")
  assert.equal(snap.capacity.actualJh.value,19);
});
test("la route est RBAC et la fiche relie les deux colonnes au dashboard",()=>{
 const api=file("src/app/api/admin/sprints/capacity-kpis/route.ts");
 const detail=file("src/app/app/admin/sprints/[sprintId]/page.tsx");
 const panel=file("src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx");
 const dashboard=file("src/server/dashboard/cycle-reader.ts");
 assert.match(api,/authorizeApi\(req,"write",resource\)/);
 assert.match(detail,/readSprintCapacityKpiView\(db,teamId,cycle\)/);
 assert.match(panel,/group==="capacity"/);
 assert.match(panel,/calculatedPlanned/);
 assert.match(panel,/calculatedActual/);
 assert.match(panel,/step=\{field\.kind==="jh"\?"0.0001":1\}/);
 assert.match(dashboard,/readSavedCapacityKpis\(db,sprint\.id\)/);
 for(const lang of ["fr","en"]){
  const json=JSON.parse(file("src/i18n/"+lang+".json"));
  assert.ok(json.sprintDetail.indicatorCapacityTitle);
  assert.ok(json.sprintDetail.indicatorCapacityPlanned);
  assert.ok(json.sprintDetail.indicatorCapacityActual);
 }
});
