import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {requireScopedCycleSchema} from "../src/server/teams/cycle-schema";

type Row=Record<string,unknown>;
function fakeDb(options:{missingTable?:string;missingColumn?:string}={}){
 const sql:string[]=[];
 const db={query:async(query:string,params?:unknown[])=>{
  sql.push(query);
  if(query.includes("pg_catalog.pg_class")){
   const names=params?.[0] as string[];
   return {rows:names.filter(name=>name!==options.missingTable).map(name=>({name}))};
  }
  if(query.includes("column_name IN ('agile_mode'")){
   return {rows:["agile_mode","is_archived"].filter(name=>options.missingColumn!=="smn_team."+name)
    .map(column_name=>({column_name}))};
  }
  if(query.includes("information_schema.columns")){
   const tables=params?.[0] as string[];
   const expected:Record<string,string[]>={
    smn_scrum_cadence:["team_id","revision","duration_weeks","start_day","end_day","start_time","end_time","time_zone"],
    smn_sprint:["id","team_id","number","name","start_at","end_at","time_zone","created_by","deleted_at"],
    smn_sprint_audit:["id","sprint_id","action","actor_id","details"],
    smn_scrum_template_occurrence:["id","template_id","template_revision","sprint_id","name","starts_at","ends_at","generation_source","status","status_explicit","actual_minutes"],
    smn_kanban_cadence:["team_id","revision","frequency","time_zone"],
    smn_kanban_period:["id","team_id","name","start_on","end_on","time_zone","created_by","deleted_at"],
    smn_kanban_period_audit:["id","period_id","action","details","actor_id"]
   };
   const rows:Row[]=tables.flatMap(table=>(expected[table]??[]).map(column_name=>({table_name:table,column_name})))
    .filter(row=>row.table_name+"."+row.column_name!==options.missingColumn);
   return {rows};
  }
  throw Error("unexpected-query");
 }} as unknown as Client;
 return {db,sql};
}

for(const mode of ["scrum","kanban"] as const){
 test("cycle schema "+mode+" : contrat SQL valide",async()=>{
  const {db,sql}=fakeDb();
  await requireScopedCycleSchema(db,mode);
  assert.equal(sql.length,3);
 });
 test("cycle schema "+mode+" : table absente refusée",async()=>{
  const missingTable=mode==="scrum"?"smn_sprint":"smn_kanban_period";
  await assert.rejects(requireScopedCycleSchema(fakeDb({missingTable}).db,mode),/cycle-schema-not-ready/);
 });
 test("cycle schema "+mode+" : colonne absente refusée",async()=>{
  const missingColumn=mode==="scrum"?"smn_sprint.team_id":"smn_kanban_period.team_id";
  await assert.rejects(requireScopedCycleSchema(fakeDb({missingColumn}).db,mode),/cycle-schema-not-ready/);
 });
 test("cycle schema "+mode+" : colonne de mode équipe absente refusée",async()=>{
  await assert.rejects(requireScopedCycleSchema(fakeDb({missingColumn:"smn_team.agile_mode"}).db,mode),
   /cycle-schema-not-ready/);
 });
}
