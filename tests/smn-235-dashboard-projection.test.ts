import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {Client} from "pg";
import {readCycleDashboard,sprintCapacityDates,closedSnapshotProjection} from "../src/server/dashboard/cycle-reader";
import {readActualCapacity} from "../src/server/capacity/actual";
import type {SprintContextItem} from "../src/lib/sprint-context";
import CycleOverview from "../src/app/app/cycle-overview";
import type {DashboardContext} from "../src/server/dashboard/read";

const team="team-1";
const context:DashboardContext={productId:"product",product:"My Product",teamId:team,team:"Team Tiger",mode:"scrum"};
const sprint=(id:string,status="active"):SprintContextItem=>({
 id,name:id,status,startAt:"2026-10-12T07:00:00Z",
 endAt:"2026-10-23T16:00:00Z",timeZone:"Europe/Paris",suspended:false
});
const read=(queries:(text:string,args?:readonly unknown[])=>{rows:unknown[]})=>{
 const seen:string[]=[];
 const db={query:async (sql:string,args?:readonly unknown[])=>{
  seen.push(sql);
  assert.doesNotMatch(sql,/\b(?:CREATE|ALTER|INSERT|UPDATE|DELETE|DROP)\b/i);
  if(sql.includes("SELECT now() AS at"))return {rows:[{at:"2026-10-23T12:00:00Z"}]};
  return queries(sql,args);
 }} as unknown as Client;
 return {db,seen};
};
function sampleSnapshot(sp:number|null,goal:string){
 return {sprint:{id:"sprint-1"},goals:[{id:"goal-1",title:goal,evaluation:"not_evaluated",revision:1}],
  storyPoints:{initial_sp:"8",done_sp:sp===null?null:String(sp)},
  capacity:{initial_jh:"14.5",actual_jh:"0",provenance:"Saisie"}};
}

describe("SMN-235 — projection dashboard isolée du Sprint",()=>{
 it("lit strictement le snapshot V2 du Sprint clôturé, même si les sources courantes ont changé",async()=>{
  const fake=read((sql,args)=>{
   if(sql.includes("SELECT s.status")){assert.deepEqual(args,["sprint-1",team]);return {rows:[{status:"closed"}]};}
   if(sql.includes("to_regclass"))return {rows:[{present:true}]};
   if(sql.includes("SELECT version,snapshot"))return {rows:[{version:2,snapshot:sampleSnapshot(0,"Objectif figé")} ]};
   throw Error("Une lecture de source actuelle est interdite pour les clôtures : "+sql);
  });
  const result=await readCycleDashboard(fake.db,team,sprint("sprint-1","closed"));
  assert.equal(result.snapshotVersion,2);
  assert.equal(result.cycleId,"sprint-1");
  assert.equal(result.goals.state,"available");
  if(result.goals.state==="available")assert.equal(result.goals.items[0].title,"Objectif figé");
  assert.equal(result.storyPoints.done.state,"available");
  if(result.storyPoints.done.state==="available"){
   assert.equal(result.storyPoints.done.value,0);
   assert.equal(result.storyPoints.done.source,"closure-snapshot");
  }
  assert.equal(result.capacity.actualJh.state,"available");
  if(result.capacity.actualJh.state==="available")assert.equal(result.capacity.actualJh.value,0);
  assert.ok(fake.seen.every(sql=>!sql.includes("FROM public.smn_sprint_story_points")));
 });
 it("refuse un identifiant hors du périmètre équipe, même s'il existe ailleurs",async()=>{
  const fake=read(()=>({rows:[]}));
  await assert.rejects(()=>readCycleDashboard(fake.db,team,sprint("other-team-sprint")),
   /dashboard-cycle-out-of-scope/);
  assert.equal(fake.seen.length,1);
 });
 it("conserve les objectifs multiples et les vrais zéros sur un Sprint ouvert",async()=>{
  const fake=read((sql,args)=>{
   if(sql.includes("SELECT s.status")){assert.deepEqual(args,["sprint-1",team]);return {rows:[{status:"active"}]};}
   if(sql.includes("to_regclass")){
    const name=args?.[0];
    return {rows:[{present:name!=="public.smn_capacity_period_override"}]};
   }
   if(sql.includes("FROM public.smn_sprint_goal"))return {rows:[
    {id:"g1",title:"Qualité",evaluation:"not_evaluated"},
    {id:"g2",title:"Livraison",evaluation:"achieved"}
   ]};
   if(sql.includes("FROM public.smn_sprint_story_points"))return {rows:[{initial_sp:"0",done_sp:null}]};
   if(sql.startsWith("SAVEPOINT ")||sql.startsWith("RELEASE SAVEPOINT ")||
      sql.startsWith("ROLLBACK TO SAVEPOINT "))return {rows:[]};
   if(sql.includes("SELECT now() AS now_at"))return {rows:[{now_at:"2026-10-23T12:00:00Z"}]};
   if(sql.includes("information_schema.tables"))return {rows:[]};
   throw Error("Unexpected SQL "+sql);
  });
  const result=await readCycleDashboard(fake.db,team,sprint("sprint-1"));
  assert.equal(result.goals.state,"available");
  if(result.goals.state==="available")assert.equal(result.goals.items.length,2);
  assert.equal(result.storyPoints.initial.state,"available");
  if(result.storyPoints.initial.state==="available")assert.equal(result.storyPoints.initial.value,0);
  assert.equal(result.storyPoints.done.state,"not-recorded");
  assert.equal(result.capacity.initialJh.state,"unavailable");
 });
 it("ne déduit aucune mesure courante lorsque la clôture Vn est absente",async()=>{
  const fake=read(sql=>{
   if(sql.includes("SELECT s.status"))return {rows:[{status:"closed"}]};
   if(sql.includes("to_regclass"))return {rows:[{present:false}]};
   throw Error("current sources forbidden");
  });
  const result=await readCycleDashboard(fake.db,team,sprint("sprint-1","closed"));
  assert.equal(result.goals.state,"unavailable");
  assert.equal(result.capacity.actualJh.state,"unavailable");
  assert.equal(result.storyPoints.initial.state,"unavailable");
 });
 it("préserve le zéro historique, la nullité et les valeurs de source absentes",()=>{
  const value=closedSnapshotProjection(sampleSnapshot(null,"Objectif"),1);
  assert.equal(value.storyPoints.done.state,"not-recorded");
  assert.equal(value.capacity.actualJh.state,"available");
  if(value.capacity.actualJh.state==="available")assert.equal(value.capacity.actualJh.value,0);
  const missing=closedSnapshotProjection({goals:[],storyPoints:null},1);
  assert.equal(missing.capacity.initialJh.state,"unavailable");
  assert.equal(missing.goals.state,"available");
 });
  it("n'ouvre pas de transaction imbriquée lors d'une lecture de capacité externe",async()=>{
   const sql:string[]=[];
   const db={query:async(statement:string)=>{
     sql.push(statement);
     if(statement.includes("SELECT t.id FROM public.smn_team"))return {rows:[{id:team}]};
     if(statement.includes("SELECT (now() AT TIME ZONE"))return {rows:[{today:"2026-10-23"}]};
     if(statement.includes("FROM public.smn_capacity_period_override")&&
        statement.includes("closed_at"))return {rows:[]};
     if(statement.includes("FROM public.smn_capacity_initial_snapshot"))return {rows:[]};
     throw Error("Unexpected capacity query: "+statement);
   }} as unknown as Client;
   const result=await readActualCapacity(db,"2026-11-09","2026-11-20",undefined,
    {externalTransaction:true});
   assert.equal(result.status,"upcoming");
   assert.equal(result.retainedJh,null);
   assert.ok(!sql.some(statement=>/\\b(?:BEGIN|COMMIT|ROLLBACK)\\b/i.test(statement)));
  });
 it("traduit une fin de Sprint exclusive en date inclusive, même un lundi à minuit",()=>{
  const s={...sprint("sprint-1"),
   startAt:"2026-11-09T08:00:00Z",endAt:"2026-11-22T23:00:00Z"};
  assert.deepEqual(sprintCapacityDates(s),{start:"2026-11-09",end:"2026-11-22"});
 });
 it("rend les objectifs et les valeurs en français sans inventer les tickets",()=>{
  const base=closedSnapshotProjection(sampleSnapshot(12,"Stabiliser la livraison"),2);
  const projection={
   teamId:team,cycleId:"sprint-1",cycleStatus:"closed",snapshotVersion:2,
   ...base,
   tickets:{initial:{state:"unavailable",reason:"producer-not-ready"},
    done:{state:"unavailable",reason:"producer-not-ready"}},
   workingDaysRemaining:{state:"unavailable",reason:"producer-not-ready"},
   events:{state:"unavailable",reason:"producer-not-ready"},
   obstacles:{state:"unavailable",reason:"producer-not-ready"},
   risks:{state:"unavailable",reason:"producer-not-ready"},
   notesAndAlerts:{state:"unavailable",reason:"producer-not-ready"}
  } as const;
  const html=renderToStaticMarkup(createElement(CycleOverview,{
   context,locale:"fr",teamHref:"/app/team/team-1",cycle:sprint("sprint-1","closed"),
   projection
  }));
  assert.match(html,/Stabiliser la livraison/);
  assert.match(html,/Instantané de clôture/);
  assert.match(html,/12/);
  assert.match(html,/Source non encore raccordée/);
  assert.match(html,/Tickets/);
  const english=renderToStaticMarkup(createElement(CycleOverview,{
   context,locale:"en",teamHref:"/app/team/team-1",cycle:sprint("sprint-1","closed"),
   projection
  }));
  assert.match(english,/Closure snapshot/);
  assert.match(english,/View sprint details/);
 });
});
