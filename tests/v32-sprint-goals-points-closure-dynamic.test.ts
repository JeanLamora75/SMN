import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {writeSprintGoal} from "../src/server/sprints/goals";
import {writeStoryPoints} from "../src/server/sprints/story-points";
import {changeSprintClosure} from "../src/server/sprints/closure";

const sprintId="123e4567-e89b-42d3-a456-426614174000";
const goalId="123e4567-e89b-42d3-a456-426614174001";
type Call={sql:string;args:unknown[]};
type Config={auditFails?:boolean;missingSprint?:boolean;closed?:boolean;revision?:number};
function fixture(config:Config={}){
 const calls:Call[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  calls.push({sql,args});
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[],rowCount:0};
  if(sql.includes("array_agg(relname)"))return {rows:[{present:[
   "smn_scrum_cadence","smn_scrum_cadence_audit","smn_meeting_actual_duration_audit",
   "smn_exceptional_meeting_participant","smn_exceptional_meeting_participant_audit",
   "smn_exceptional_capacity_impact_history"
  ]}]};
  if(sql.includes("FROM pg_class"))return {rows:[
   {name:"smn_sprint_capacity_kpi"},{name:"smn_sprint_capacity_kpi_audit"}
  ]};
  if(sql.includes("to_regclass"))return {rows:[{present:"available"}]};
  if(sql.includes("FROM public.smn_sprint s JOIN public.smn_team t")||
     sql.includes("FROM public.smn_sprint s\n JOIN public.smn_team t")){
   assert.match(sql,/FOR UPDATE OF s/);
   return {rows:config.missingSprint?[]:[{id:sprintId,team_id:"team-1",
    name:"Sprint",status:config.closed?"closed":"active",
    start_at:"2026-10-01T08:00:00Z",end_at:"2026-10-15T18:00:00Z",time_zone:"Europe/Paris"}]};
  }
  if(sql.includes("FROM public.smn_sprint_goal")&&sql.includes("FOR UPDATE"))
   return {rows:[{id:goalId,title:"Avant",evaluation:"not_evaluated",comment:null,revision:config.revision??1}]};
  if(sql.includes("FROM public.smn_sprint_story_points WHERE sprint_id")&&sql.includes("FOR UPDATE"))
   return {rows:[{initial_sp:"5",added_sp:"0",removed_sp:"0",done_sp:"2",revision:config.revision??1}]};
  if(sql.includes("INSERT INTO public.smn_sprint_goal_audit")||
     sql.includes("INSERT INTO public.smn_sprint_story_points_audit")||
     sql.includes("INSERT INTO public.smn_sprint_closure_audit")){
   if(config.auditFails)throw Error("audit-failure");
  }
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,calls};
}
const goal=(revision=1)=>({sprintId,id:goalId,title:"Après",evaluation:"partially_achieved",comment:null,revision});
const points=(revision=1)=>({sprintId,revision,points:{initial:5,added:1,removed:0,done:3}});
const writes=(calls:Call[])=>calls.filter(x=>/\b(?:INSERT|UPDATE|DELETE)\b/i.test(x.sql));
for(const [name,action] of [
 ["Objectifs", (db:Client,revision:number)=>writeSprintGoal(db,"admin",goal(revision))],
 ["Story Points",(db:Client,revision:number)=>writeStoryPoints(db,"admin",points(revision))]
] as const){
 test(name+" : révision actuelle validée avec audit et COMMIT",async()=>{
  const f=fixture();const result=await action(f.db,1);
  assert.equal(result.ok,true);
  assert.equal(f.calls.at(-1)?.sql,"COMMIT");
  assert.ok(f.calls.some(c=>c.sql.includes("_audit")));
 });
 test(name+" : révision obsolète entraîne ROLLBACK sans écriture",async()=>{
  const f=fixture({revision:2});
  assert.deepEqual(await action(f.db,1),{ok:false,error:"conflict"});
  assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
  assert.equal(writes(f.calls).length,0);
 });
 test(name+" : échec d'audit après modification annule la transaction",async()=>{
  const f=fixture({auditFails:true});
  await assert.rejects(action(f.db,1),/audit-failure/);
  assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
  assert.ok(writes(f.calls).some(c=>/UPDATE public/.test(c.sql)));
  assert.ok(!f.calls.some(c=>c.sql==="COMMIT"));
 });
 test(name+" : Sprint inaccessible interdit toute écriture",async()=>{
  const f=fixture({missingSprint:true});
  assert.deepEqual(await action(f.db,1),{ok:false,error:"not-found"});
  assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
  assert.equal(writes(f.calls).length,0);
 });
}
test("Clôture : Sprint absent refuse la transaction sans écriture",async()=>{
 const f=fixture({missingSprint:true});
 assert.deepEqual(await changeSprintClosure(f.db,"admin",{sprintId,action:"reopen"}),{ok:false,error:"not-found"});
 assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
 assert.equal(writes(f.calls).length,0);
});
test("Clôture : transition invalide annule sans écriture",async()=>{
 const f=fixture();
 assert.deepEqual(await changeSprintClosure(f.db,"admin",{sprintId,action:"reopen"}),{ok:false,error:"invalid-transition"});
 assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
 assert.equal(writes(f.calls).length,0);
});
test("Clôture : réouverture auditée validée en transaction",async()=>{
 const f=fixture({closed:true});
 const result=await changeSprintClosure(f.db,"admin",{sprintId,action:"reopen"});
 assert.deepEqual(result,{ok:true,status:"finished",version:null});
 assert.equal(f.calls.at(-1)?.sql,"COMMIT");
 assert.ok(f.calls.some(c=>c.sql.includes("INSERT INTO public.smn_sprint_closure_audit")));
});
test("Clôture : échec d'audit après changement de statut provoque ROLLBACK",async()=>{
 const f=fixture({closed:true,auditFails:true});
 await assert.rejects(changeSprintClosure(f.db,"admin",{sprintId,action:"reopen"}),/audit-failure/);
 assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
 assert.ok(f.calls.some(c=>c.sql.includes("UPDATE public.smn_sprint SET status")));
 assert.ok(!f.calls.some(c=>c.sql==="COMMIT"));
});
