import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import type {Client} from "pg";
import {resolveRegistryReadContext} from "../src/server/registries/team-access";
import {readSprintGoals,writeSprintGoal} from "../src/server/sprints/goals";

const sprintId="123e4567-e89b-42d3-a456-426614174000";
const goalId="123e4567-e89b-42d3-a456-426614174001";
const actor={accountId:"admin_1",role:"admin" as const};
type Call={sql:string;args:readonly unknown[]};
function fixture(owner="team_1",initialRevision=1){
 const calls:Call[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  calls.push({sql,args});
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[]};
  if(sql.includes("array_agg(relname)"))return {rows:[{present:[
   "smn_scrum_cadence","smn_scrum_cadence_audit"
  ]}]};
  if(sql.includes("to_regclass("))return {rows:[{present:"present"}]};
  if(sql.includes("SELECT schema_version FROM public.smn_installation"))
   return {rows:[{schema_version:33}]};
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:33}]};
  if(sql.includes("FROM public.smn_account_team_preference"))
   return {rows:[{team_id:"team_1"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:"product",product:"Product",team_id:"team_1",team:"Team",mode:"scrum"}]};
  if(sql.includes("FROM public.smn_sprint s")&&sql.includes("JOIN public.smn_team t")){
   assert.match(sql,/i\.schema_version BETWEEN 28 AND 33/);
   assert.match(sql,/s\.team_id=\$2/);
   return {rows:owner===args[1]?[{
    id:sprintId,name:"Sprint v33",status:"active",
    start_at:"2026-11-01",end_at:"2026-11-14"
   }]:[]};
  }
  if(sql.includes("FROM public.smn_sprint_goal")&&sql.includes("FOR UPDATE"))
   return {rows:[{id:goalId,title:"Original",evaluation:"not_evaluated",
    comment:null,revision:initialRevision}]};
  if(sql.includes("FROM public.smn_sprint_goal")&&sql.includes("ORDER BY"))
   return {rows:[{id:goalId,title:"Objectif v33",evaluation:"not_evaluated",
    comment:null,revision:2}]};
  if(/^(INSERT INTO|UPDATE) public\.smn_sprint_goal/.test(sql))return {rows:[],rowCount:1};
  throw Error("Unexpected SQL: "+sql);
 }} as unknown as Client;
 return {db,calls};
}
const access={actor,teamId:"team_1"};

test("v33 : contexte multiéquipes accessible avec son schéma natif",async()=>{
 const f=fixture();
 const c=await resolveRegistryReadContext(f.db,actor,"team_1");
 assert.equal(c.version,28);
 assert.equal(c.schemaVersion,33);
 assert.equal(c.team?.team_id,"team_1");
});
test("v33 : création d'objectif sous équipe autorisée, avec audit et commit",async()=>{
 const f=fixture();
 const r=await writeSprintGoal(f.db,actor.accountId,{
  sprintId,title:" Objectif v33 ",evaluation:"not_evaluated",comment:null
 },access);
 assert.equal(r.ok,true);
 assert.ok(f.calls.some(x=>x.sql.startsWith("INSERT INTO public.smn_sprint_goal(")));
 assert.ok(f.calls.some(x=>x.sql.startsWith("INSERT INTO public.smn_sprint_goal_audit(")));
 assert.equal(f.calls.at(-1)?.sql,"COMMIT");
});
test("v33 : modification concurrente refusée sans altérer l'objectif",async()=>{
 const f=fixture("team_1",2);
 const r=await writeSprintGoal(f.db,actor.accountId,{
  sprintId,id:goalId,revision:1,title:"Modifié",evaluation:"partially_achieved",comment:"Note"
 },access);
 assert.deepEqual(r,{ok:false,error:"conflict"});
 assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
 assert.equal(f.calls.some(x=>x.sql.startsWith("UPDATE public.smn_sprint_goal")),false);
});
test("v33 : une autre équipe ne permet aucune création ni audit",async()=>{
 const f=fixture("team_2");
 const r=await writeSprintGoal(f.db,actor.accountId,{
  sprintId,title:"Interdit",evaluation:"not_evaluated",comment:null
 },access);
 assert.deepEqual(r,{ok:false,error:"not-found"});
 assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
 assert.equal(f.calls.some(x=>x.sql.startsWith("INSERT INTO public.smn_sprint_goal")),false);
});
test("v33 : lecture contextualisée des objectifs",async()=>{
 const f=fixture();
 const result=await readSprintGoals(f.db,sprintId,access);
 assert.equal(result?.goals.length,1);
 assert.equal(result?.sprint.name,"Sprint v33");
});
test("v33 : le détail transmet le teamId et la route conserve les garde-fous",()=>{
 const panel=readFileSync("src/app/app/admin/sprints/[sprintId]/sprint-goals-panel.tsx","utf8");
 const page=readFileSync("src/app/app/admin/sprints/[sprintId]/page.tsx","utf8");
 const route=readFileSync("src/app/api/admin/sprints/goals/route.ts","utf8");
 assert.match(page,/sprintId=\{cycle\.id\} teamId=\{teamId\}/);
 assert.match(panel,/new URLSearchParams\(\{teamId\}\)/);
 assert.match(route,/context\.schemaVersion!==33/);
 assert.match(route,/context\.team\?\.team_id!==params\.get\("teamId"\)/);
 assert.match(route,/authorizeApi\(req,"write",target\)/);
});
