import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {deriveSprintIndicators,parseIndicatorDraft} from "../src/lib/sprint-indicator-values";
import {readSprintDetailIndicators} from "../src/server/sprints/indicators-read";
import {writeSprintScores} from "../src/server/sprints/sprint-scores";

const id="123e4567-e89b-42d3-a456-426614174000";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

describe("SMN-234 D3 — calculs purs des indicateurs",()=>{
 it("recalcule F05/F06/F07/F12 sans écriture ou plafonnement",()=>{
  assert.deepEqual(deriveSprintIndicators(
   {initial:10,added:5,removed:2,done:15},{initial:4,done:5}),
   {final:13,remaining:-2,rate:15/13*100,ticketRate:125,overrun:true});
 });
 it("préserve null et zéro et refuse les divisions par zéro",()=>{
  const zero=deriveSprintIndicators(
   {initial:0,added:0,removed:0,done:0},{initial:0,done:0});
  assert.equal(zero.final,0);assert.equal(zero.remaining,0);
  assert.equal(zero.rate,null);assert.equal(zero.ticketRate,null);
  const missing=deriveSprintIndicators(
   {initial:null,added:1,removed:0,done:0},{initial:null,done:2});
  assert.equal(missing.final,null);assert.equal(missing.remaining,null);
  assert.equal(missing.rate,null);assert.equal(missing.ticketRate,null);
 });
 it("valide les entiers, les champs vides et les scores 1–5",()=>{
  assert.deepEqual(parseIndicatorDraft("", "count"),{ok:true,value:null});
  assert.deepEqual(parseIndicatorDraft("0","count"),{ok:true,value:0});
  assert.equal(parseIndicatorDraft("-1","count").ok,false);
  assert.equal(parseIndicatorDraft("1.3","count").ok,false);
  assert.equal(parseIndicatorDraft("1000000001","count").ok,false);
  assert.equal(parseIndicatorDraft("0","score").ok,false);
  assert.equal(parseIndicatorDraft("6","score").ok,false);
  assert.deepEqual(parseIndicatorDraft("5","score"),{ok:true,value:5});
 });
});

function fake(handler:(sql:string,params?:unknown[])=>{rows:unknown[]}){
 const statements:string[]=[];
 const db={query:async(sql:string,params?:unknown[])=>{
  statements.push(sql);
  if(sql.startsWith("SELECT to_regclass(\'public.smn_sprint_scores\') AS present")||sql.startsWith("SELECT to_regclass(\'public.smn_sprint_scores_audit\') AS present"))return {rows:[{present:"migrated"}]};
  if(!/^\s*(SELECT|BEGIN|COMMIT|ROLLBACK|CREATE|INSERT|UPDATE)/i.test(sql))
   throw Error("Unsupported query");
  return handler(sql,params);
 }} as unknown as Client;
 return {db,statements};
}
describe("SMN-234 D3 — lecteurs historiques et autorisations",()=>{
 it("refuse un sprint hors équipe avant toute lecture des valeurs",async()=>{
  const f=fake(()=>({rows:[]}));
  assert.equal(await readSprintDetailIndicators(f.db,"team-1",id),null);
  assert.equal(f.statements.length,1);
 });
 it("lit uniquement des SELECT en consultation courante, sans inventer zéro",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"active"}]}:
    sql.includes("to_regclass")?{rows:[{points:true,tickets:true,scores:false}]}:
    sql.includes("smn_sprint_story_points")?{rows:[{
     initial:"10",added:"0",removed:null,done:"5",revision:2}]}:
    sql.includes("smn_sprint_ticket_counts")?{rows:[{
     initial:"0",done:null,revision:4}]}:{rows:[]});
  const v=await readSprintDetailIndicators(f.db,"team-1",id);
  assert.equal(v?.state,"available");
  if(v?.state==="available"){
   if(v.points.state!=="available"||v.tickets.state!=="available"||v.scores.state!=="available")
    assert.fail("Current indicator groups must be available");
   assert.deepEqual(v.points.values,{initial:10,added:0,removed:null,done:5});
   assert.deepEqual(v.tickets.values,{initial:0,done:null});
   assert.deepEqual(v.scores.values,{confidence:null,clarity:null});
   assert.equal(v.scores.revision,0);
  }
  assert.ok(f.statements.every(sql=>/^\s*SELECT/i.test(sql)));
 });
 it("un sprint clos récupère le snapshot Vn et non l'état courant",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:2,snapshot:{
     storyPoints:{initial_sp:"10",added_sp:"2",removed_sp:"1",done_sp:"7"},
     ticketCounts:{initial_tickets:"5",done_tickets:"3"},
     confidenceClarity:{confidence:4,clarity:5}}}]});
  const v=await readSprintDetailIndicators(f.db,"team-1",id);
  assert.equal(v?.state,"available");
  if(v?.state==="available"){
   if(v.points.state!=="available"||v.tickets.state!=="available"||v.scores.state!=="available")
    assert.fail("Closed snapshot indicator groups must be available");
   assert.equal(v.snapshotVersion,2);assert.equal(v.points.values.added,2);
   assert.equal(v.scores.values.clarity,5);assert.equal(v.tickets.values.done,3);
  }
  assert.ok(!f.statements.some(q=>q.includes("FROM public.smn_sprint_story_points WHERE")));
 });
 it("refuse le remplacement par l'état courant d'un vieux snapshot incomplet",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:1,snapshot:{storyPoints:null,ticketCounts:null}}]});
  const v=await readSprintDetailIndicators(f.db,"team-1",id);
  assert.equal(v?.state,"available");
  if(v?.state==="available"){
   assert.equal(v.scores.state,"unavailable");
   if(v.scores.state==="unavailable")assert.equal(v.scores.reason,"history-missing");
  }
 });
 it("sauvegarde les notes via une transaction contrôlée et versionnée",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.id,s.status")?{rows:[{id,status:"active"}]}:
   sql.includes("SELECT confidence,clarity,revision")?{rows:[]}: {rows:[]});
  const outcome=await writeSprintScores(f.db,"account",{
   sprintId:id,revision:0,scores:{confidence:4,clarity:5}});
  assert.equal(outcome.ok,true);
  assert.ok(f.statements.some(sql=>sql.includes("smn_sprint_scores_audit")));
 });
 it("rejette une note hors bornes avant la transaction et la création des tables",async()=>{
  const f=fake(()=>({rows:[]}));
  assert.deepEqual(await writeSprintScores(f.db,"account",{
   sprintId:id,revision:0,scores:{confidence:6,clarity:1}}),
   {ok:false,error:"invalid-input"});
  assert.equal(f.statements.length,0);
 });
 it("interdit une modification d'un sprint clôturé",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.id,s.status")?
   {rows:[{id,status:"closed"}]}:{rows:[]});
  const outcome=await writeSprintScores(f.db,"account",{
   sprintId:id,revision:0,scores:{confidence:4,clarity:5}});
  assert.deepEqual(outcome,{ok:false,error:"closed-period"});
  assert.ok(!f.statements.some(sql=>sql.includes("INSERT INTO public.smn_sprint_scores(")));
 });
 it("contrôle les permissions directement dans la route de mutation",()=>{
  const api=read("src/app/api/admin/sprints/scores/route.ts");
  assert.match(api,/authorizeApi\(req,"write",resource\)/);
  assert.match(api,/withAuthDb\(/);
 });
 it("l'onglet réel utilise le lecteur collectif et le panneau sans sélecteur Sprint",()=>{
  const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
  const panel=read("src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx");
  assert.match(page,/active==="indicators"/);
  assert.match(page,/readSprintDetailIndicators\(/);
  assert.match(panel,/sprintId/);
  assert.doesNotMatch(panel,/\/api\/admin\/sprints\/states/);
 });
});
