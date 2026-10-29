import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {readSprintDetailGoals} from "../src/server/sprints/goals-detail-read";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sample={id:"goal-1",title:"Livrer la recherche",evaluation:"partially_achieved",
 comment:"Critère partiellement rempli",revision:3};

function fake(lookup:(sql:string,params?:readonly unknown[])=>{rows:unknown[]}){
 const queries:{sql:string;params?:readonly unknown[]}[]=[];
 const db={query:async(sql:string,params?:readonly unknown[])=>{
  assert.doesNotMatch(sql,/\b(?:CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|TRUNCATE)\b/i);
  queries.push({sql,params});
  return lookup(sql,params);
 }} as unknown as Client;
 return {db,queries};
}
function scope(status="active"){return {rows:[{status}]};}

describe("SMN-234 D2 — objectifs contextualisés et sans DDL",()=>{
 it("refuse un Sprint qui ne relève pas de l'équipe sans consulter les objectifs",async()=>{
  const f=fake(()=>({rows:[]}));
  assert.equal(await readSprintDetailGoals(f.db,"team-1","foreign"),null);
  assert.equal(f.queries.length,1);
  assert.deepEqual(f.queries[0].params,["foreign","team-1"]);
 });
 it("affiche tous les objectifs réels avec les commentaires et révisions",async()=>{
  const f=fake(sql=>{
   if(sql.includes("SELECT s.status"))return scope();
   if(sql.includes("to_regclass"))return {rows:[{present:true}]};
   if(sql.includes("FROM public.smn_sprint_goal"))return {rows:[sample,{...sample,id:"goal-2",revision:1}]};
   throw Error("Query unexpected: "+sql);
  });
  const r=await readSprintDetailGoals(f.db,"team-1","sprint-1");
  assert.equal(r?.state,"available");
  if(r?.state==="available"){
   assert.equal(r.items.length,2);assert.equal(r.items[0]?.comment,sample.comment);
   assert.equal(r.items[0]?.revision,3);assert.equal(r.snapshotVersion,null);
  }
  assert.ok(f.queries.every(q=>!q.sql.includes("CREATE TABLE")));
 });
 it("distingue zéro objectif d'une source absente",async()=>{
  const available=fake(sql=>sql.includes("SELECT s.status")?scope():
   sql.includes("to_regclass")?{rows:[{present:true}]}:{rows:[]});
  const empty=await readSprintDetailGoals(available.db,"team-1","sprint-1");
  assert.deepEqual(empty?.state,"available");
  if(empty?.state==="available")assert.equal(empty.items.length,0);
  const absent=fake(sql=>sql.includes("SELECT s.status")?scope():{rows:[{present:false}]});
  assert.deepEqual(await readSprintDetailGoals(absent.db,"team-1","sprint-1"),
   {state:"unavailable",reason:"schema-missing"});
 });
 it("lit le snapshot V2 d'un Sprint clos, jamais la table courante",async()=>{
  const f=fake(sql=>{
   if(sql.includes("SELECT s.status"))return scope("closed");
   if(sql.includes("to_regclass"))return {rows:[{present:true}]};
   if(sql.includes("SELECT version,snapshot"))return {rows:[{
    version:2,snapshot:{goals:[sample]}}]};
   throw Error("Current goal read forbidden");
  });
  const r=await readSprintDetailGoals(f.db,"team-1","sprint-1");
  assert.equal(r?.state,"available");
  if(r?.state==="available"){
   assert.equal(r.items[0]?.title,sample.title);
   assert.equal(r.snapshotVersion,2);
   assert.equal(r.source,"closure-snapshot");
  }
  assert.ok(!f.queries.some(x=>x.sql.includes("FROM public.smn_sprint_goal ")));
 });
 it("n'invente pas les objectifs d'une clôture privée de snapshot",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?scope("closed"):
   sql.includes("to_regclass")?{rows:[{present:false}]}:{rows:[]});
  assert.deepEqual(await readSprintDetailGoals(f.db,"team-1","sprint-1"),
   {state:"unavailable",reason:"history-missing"});
 });
 it("déclare indisponible un snapshot qui n'a pas la liste des objectifs",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?scope("closed"):
   sql.includes("to_regclass")?{rows:[{present:true}]}:{rows:[{version:1,snapshot:{}}]});
  assert.deepEqual(await readSprintDetailGoals(f.db,"team-1","sprint-1"),
   {state:"unavailable",reason:"history-missing"});
 });
});
describe("SMN-234 D2 — écran et écritures",()=>{
 it("conserve la mutation contrôlée avec révision et refus des clôtures",()=>{
  const code=source("src/server/sprints/goals.ts");
  const api=source("src/app/api/admin/sprints/goals/route.ts");
  assert.match(code,/old\.rows\[0\]\.revision!==v\.revision/);
  assert.match(code,/sprint\.status==="closed"/);
  assert.match(code,/smn_sprint_goal_audit/);
  assert.match(api,/authorizeApi\(req,"write",target\)/);
 });
 it("n'expose les commandes de création et modification qu'aux administrateurs",()=>{
  const page=source("src/app/app/admin/sprints/[sprintId]/page.tsx");
  const panel=source("src/app/app/admin/sprints/[sprintId]/sprint-goals-panel.tsx");
  assert.match(page,/readSprintDetailGoals\(/);
  assert.match(page,/<SprintGoalsPanel\s/);
  assert.match(panel,/canManage&&status!=="closed"/);
  assert.match(panel,/method:"POST"/);
  assert.match(panel,/revision:current!\.revision/);
  assert.match(panel,/router\.refresh\(\)/);
 });
});
