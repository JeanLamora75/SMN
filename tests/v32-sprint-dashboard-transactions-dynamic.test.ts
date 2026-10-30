import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {writeSprintCapacityKpis} from "../src/server/sprints/sprint-capacity-kpis";
import {createDashboardNote,updateDashboardNote} from "../src/server/dashboard/notes";

const sprintId="123e4567-e89b-42d3-a456-426614174000";
const noteId="123e4567-e89b-42d3-a456-426614174001";
const capacity=(revision:number)=>({sprintId,revision,capacity:{planned:10,actual:8}});
type SqlCall={sql:string;args:unknown[]};
function capacityDb(options:{auditFails?:boolean;archived?:boolean;teamMode?:"scrum"|"kanban"}={}){
 const calls:SqlCall[]=[];let storedRevision=0;
 const db={query:async(sql:string,args:unknown[]=[])=>{
  calls.push({sql,args});
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[],rowCount:0};
  if(sql.includes("SELECT s.id,s.status FROM public.smn_sprint")){
   assert.match(sql,/to_jsonb\(t\)->>'agile_mode'/);
   assert.match(sql,/is_archived/);
   return {rows:options.archived||options.teamMode==="kanban"?[]:[{id:sprintId,status:"active"}]};
  }
  if(sql.includes("AS historical"))return {rows:[{historical:false}]};
  if(sql.includes("FROM pg_class"))return {rows:[{name:"smn_sprint_capacity_kpi"},{name:"smn_sprint_capacity_kpi_audit"}]};
  if(sql.includes("SELECT planned_jh::text")&&sql.includes("FOR UPDATE"))
   return {rows:storedRevision?[{planned_jh:"10",actual_jh:"8",revision:storedRevision}]:[]};
  if(sql.includes("INSERT INTO public.smn_sprint_capacity_kpi_audit")){
   if(options.auditFails)throw Error("simulated-audit-failure");
   return {rows:[],rowCount:1};
  }
  if(sql.includes("INSERT INTO public.smn_sprint_capacity_kpi ")||
     sql.includes("UPDATE public.smn_sprint_capacity_kpi SET")){
   storedRevision++;return {rows:[],rowCount:1};
  }
  throw Error("SQL inattendu: "+sql);
 }} as unknown as Client;
 return {db,calls};
}
test("capacité : l'échec d'insertion d'audit provoque ROLLBACK et jamais COMMIT",async()=>{
 const f=capacityDb({auditFails:true});
 await assert.rejects(writeSprintCapacityKpis(f.db,"admin",capacity(0)),/simulated-audit-failure/);
 assert.ok(f.calls.some(c=>c.sql.includes("INSERT INTO public.smn_sprint_capacity_kpi ")));
 assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
 assert.equal(f.calls.some(c=>c.sql==="COMMIT"),false);
});
test("capacité : deux écritures avec la même révision, une seule validée",async()=>{
 const f=capacityDb();
 assert.deepEqual(await writeSprintCapacityKpis(f.db,"admin",capacity(0)),{ok:true,revision:1});
 assert.deepEqual(await writeSprintCapacityKpis(f.db,"admin",capacity(0)),{ok:false,error:"conflict"});
 assert.equal(f.calls.filter(c=>c.sql==="COMMIT").length,1);
 assert.equal(f.calls.filter(c=>c.sql==="ROLLBACK").length,1);
 assert.equal(f.calls.filter(c=>c.sql.includes("INSERT INTO public.smn_sprint_capacity_kpi_audit")).length,1);
});
test("capacité : équipe archivée ou Kanban, aucune écriture et ROLLBACK",async()=>{
 for(const options of [{archived:true},{teamMode:"kanban" as const}]){
  const f=capacityDb(options);
  assert.deepEqual(await writeSprintCapacityKpis(f.db,"admin",capacity(0)),{ok:false,error:"not-found"});
  assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
  assert.ok(!f.calls.some(c=>/INSERT INTO|UPDATE public/.test(c.sql)));
 }
});
test("note : une création dans une autre équipe est refusée avant tout INSERT",async()=>{
 const calls:SqlCall[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  calls.push({sql,args});
  if(sql.includes("SELECT s.id FROM public.smn_sprint")){
   assert.match(sql,/s\.team_id=\$2/);
   assert.deepEqual(args,[sprintId,"team-other"]);
   return {rows:[]};
  }
  return {rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await createDashboardNote(db,"admin",{sprintId,teamId:"team-other",text:"Note"}),
  {ok:false,error:"not-found"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert.ok(!calls.some(c=>/INSERT INTO/.test(c.sql)));
});
test("note : erreur d'audit après UPDATE produit ROLLBACK",async()=>{
 const calls:SqlCall[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  calls.push({sql,args});
  if(sql.includes("SELECT n.id,n.body,n.status"))return {rows:[{id:noteId,body:"Avant",status:"open",sprint_status:"active"}]};
  if(sql.includes("to_regclass"))return {rows:[{ready:true}]};
  if(sql.includes("INSERT INTO public.smn_dashboard_note_edit_audit"))throw Error("simulated-note-audit-failure");
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 await assert.rejects(updateDashboardNote(db,"admin",noteId,{teamId:"team-1",sprintId,
  text:"Après",status:"done",expectedBody:"Avant",expectedStatus:"open"}),/simulated-note-audit-failure/);
 assert.ok(calls.some(c=>c.sql.includes("UPDATE public.smn_dashboard_note")));
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert.ok(!calls.some(c=>c.sql==="COMMIT"));
});
test("note : révision logique obsolète bloquée sans écriture",async()=>{
 const calls:SqlCall[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  calls.push({sql,args});
  if(sql.includes("SELECT n.id,n.body,n.status"))return {rows:[{id:noteId,body:"Autre édition",status:"open",sprint_status:"active"}]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 assert.deepEqual(await updateDashboardNote(db,"admin",noteId,{teamId:"team-1",sprintId,
  text:"Après",status:"done",expectedBody:"Avant",expectedStatus:"open"}),{ok:false,error:"conflict"});
 assert.equal(calls.at(-1)?.sql,"ROLLBACK");
 assert.ok(!calls.some(c=>/UPDATE public|INSERT INTO/.test(c.sql)));
});
