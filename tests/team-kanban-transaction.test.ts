import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {createScopedKanbanPeriod} from "../src/server/kanban/scoped-create";

type Case={cadenceRevision?:number;overlap?:boolean;teamLocked?:boolean;failAudit?:boolean};
function fake(options:Case={}){
 const calls:{sql:string;args:unknown[]|undefined}[]=[];
 const db={query:async(sql:string,args?:unknown[])=>{
  calls.push({sql,args});
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[]};
  if(sql.includes("pg_catalog.pg_class")){
   const names=args?.[0] as string[];
   return {rows:names.map(name=>({name}))};
  }
  if(sql.includes("SELECT column_name AS name"))
   return {rows:[{name:"agile_mode"},{name:"is_archived"}]};
  if(sql.includes("information_schema.columns")){
   if(sql.includes("column_name IN ('agile_mode'"))
    return {rows:[{column_name:"agile_mode"},{column_name:"is_archived"}]};
   const byTable:Record<string,string[]>={
    smn_kanban_cadence:["team_id","revision","frequency","time_zone"],
    smn_kanban_period:["id","team_id","name","start_on","end_on","time_zone","created_by","deleted_at"],
    smn_kanban_period_audit:["id","period_id","action","details","actor_id"]
   };
   return {rows:(args?.[0] as string[]).flatMap(table=>
    (byTable[table]??[]).map(column_name=>({table_name:table,column_name})))};
  }
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"installation_a",schema_version:30}]};
  if(sql.includes("FROM public.smn_account_team_preference"))return {rows:[]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:"team_a",team:"A",mode:"kanban"}]};
  if(sql.includes("FOR UPDATE OF t"))
   return {rows:options.teamLocked===false?[]:[{id:"team_a"}]};
  if(sql.includes("pg_advisory_xact_lock"))return {rows:[{}]};
  if(sql.includes("FROM public.smn_kanban_cadence"))
   return {rows:[{frequency:"weekly",time_zone:"Europe/Paris",
    revision:options.cadenceRevision??2}]};
  if(sql.includes("FROM public.smn_kanban_period")&&sql.includes("deleted_at"))
   return {rows:options.overlap?[{id:"period_previous"}]:[]};
  if(sql.includes("INSERT INTO public.smn_kanban_period_audit")){
   if(options.failAudit)throw Error("audit-failure");
   return {rows:[]};
  }
  if(sql.includes("INSERT INTO public.smn_kanban_period"))return {rows:[]};
  throw Error("unexpected SQL: "+sql.slice(0,120));
 }} as unknown as Client;
 return {db,calls};
}
const actor={accountId:"admin_a",role:"admin" as const};
const request={teamId:"team_a",startOn:"2026-11-02",cadenceRevision:2};
for(const [name,options,expectedError] of [
 ["cadence modifiée",{cadenceRevision:3},"stale-cadence"],
 ["chevauchement",{overlap:true},"overlap"]
] as const){
 test("Kanban : "+name+" déclenche un seul rollback",async()=>{
  const {db,calls}=fake(options);
  const result=await createScopedKanbanPeriod(db,actor,request);
  assert.equal(result.ok,false);
  if(!result.ok)assert.equal(result.error,expectedError);
  assert.equal(calls.filter(c=>c.sql==="ROLLBACK").length,1);
  assert.equal(calls.some(c=>c.sql==="COMMIT"),false);
  assert.equal(calls.some(c=>c.sql.includes("INSERT INTO public.smn_kanban_period")),false);
 });
}
test("Kanban : équipe verrouillée indisponible interdit toute insertion",async()=>{
 const {db,calls}=fake({teamLocked:false});
 await assert.rejects(createScopedKanbanPeriod(db,actor,request),/kanban-team-unavailable/);
 assert.equal(calls.filter(c=>c.sql==="ROLLBACK").length,1);
 assert.equal(calls.some(c=>c.sql.includes("INSERT INTO public.smn_kanban_period")),false);
});
test("Kanban : échec d'audit annule la transaction",async()=>{
 const {db,calls}=fake({failAudit:true});
 await assert.rejects(createScopedKanbanPeriod(db,actor,request),/audit-failure/);
 assert.equal(calls.filter(c=>c.sql==="ROLLBACK").length,1);
 assert.equal(calls.some(c=>c.sql==="COMMIT"),false);
});
test("Kanban : insertion et audit atomiques avec équipe ciblée",async()=>{
 const {db,calls}=fake();
 const result=await createScopedKanbanPeriod(db,actor,request);
 assert.equal(result.ok,true);
 assert.equal(calls.filter(c=>c.sql==="COMMIT").length,1);
 const insertion=calls.find(c=>c.sql.includes("INSERT INTO public.smn_kanban_period\n"));
 assert.equal(insertion?.args?.[1],"team_a");
 assert.equal(calls.some(c=>c.sql.includes("INSERT INTO public.smn_kanban_period_audit")),true);
});
