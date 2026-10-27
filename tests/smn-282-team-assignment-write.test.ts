import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {saveTeamAssignmentRevision} from "../src/server/members/team-assignment-write";

const memberId="123e4567-e89b-42d3-a456-426614174000";
const valid={
 memberId,teamId:"panda",effectiveFrom:"2026-10-28",
 contractPercent:100,allocationPercent:80,contributionPercent:70,
 shares:{scrumMaster:10,productOwner:0,developer:90},revision:2
};
type Opt={role?:boolean;team?:boolean;archived?:boolean;assignment?:boolean;
 latestRevision?:number;latestDate?:string;writeFailure?:boolean;member?:boolean};
function fixture(opt:Opt={}){
 const queries:Array<{sql:string;params:unknown[]}>= [];
 const query=async(sql:string,params:unknown[]=[])=>{
  queries.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))return {
   rows:opt.role===false?[]:[{installation_id:"singleton",schema_version:28}]
  };
  if(sql.includes("SELECT t.id AS team_id FROM public.smn_account_team_preference"))
   return {rows:[{team_id:"other"}]};
  if(sql.includes("SELECT p.id AS product_id"))return {
   rows:opt.team===false?[]:[{product_id:null,product:null,team_id:"panda",team:"Panda",mode:"scrum"}]
  };
  if(sql.includes("FROM public.smn_member m")&&sql.includes("FOR UPDATE OF m"))
   return {rows:opt.member===false?[]:[{id:memberId,archived_at:opt.archived?"2026-10-20":null}]};
  if(sql.includes("FROM public.smn_member_assignment a")&&sql.includes("FOR UPDATE OF a"))
   return {rows:opt.assignment===false?[]:[{id:"assignment-panda",start_on:"2026-10-01",end_on:null}]};
  if(sql.includes("CURRENT_DATE::text AS today"))return {rows:[{today:"2026-10-27"}]};
  if(sql.includes("FROM public.smn_member_assignment_version"))
   return {rows:[{revision:opt.latestRevision??2,effective_from:opt.latestDate??"2026-10-21"}]};
  if(sql.includes("INSERT INTO public.smn_member_assignment_version")){
   if(opt.writeFailure)throw Error("simulated-postgres-failure");
   return {rows:[],rowCount:1};
  }
  return {rows:[],rowCount:1};
 };
 return {db:{query} as unknown as Client,queries};
}
test("révision existante, verrouillage, insertion append-only puis commit",async()=>{
 const {db,queries}=fixture();
 const result=await saveTeamAssignmentRevision(db,{accountId:"admin",role:"admin"},memberId,valid);
 assert.deepEqual(result,{ok:true,assignmentId:"assignment-panda",teamId:"panda",revision:3});
 assert.equal(queries[0].sql,"BEGIN");
 assert.equal(queries.at(-1)?.sql,"COMMIT");
 assert.ok(queries.find(q=>q.sql.includes("FOR UPDATE OF m")));
 assert.ok(queries.find(q=>q.sql.includes("FOR UPDATE OF a")));
 const insert=queries.find(q=>q.sql.includes("INSERT INTO public.smn_member_assignment_version"));
 assert.ok(insert);
 assert.equal(insert.params[1],"assignment-panda");
 assert.equal(insert.params[2],3);
 assert.equal(insert.params[3],80);
 assert.equal(insert.params[7],10);
 assert.equal(insert.params[9],90);
 assert.equal(insert.params[10],"admin");
 assert.equal(queries.some(q=>q.sql.includes("INSERT INTO public.smn_member_assignment\n")),false);
 assert.equal(queries.some(q=>/DELETE FROM|UPDATE public.smn_member_assignment_version/.test(q.sql)),false);
});
test("concurrence : une révision obsolète annule la transaction sans écriture",async()=>{
 const {db,queries}=fixture({latestRevision:3});
 assert.deepEqual(await saveTeamAssignmentRevision(db,
  {accountId:"admin",role:"admin"},memberId,valid),{ok:false,error:"conflict"});
 assert.equal(queries.at(-1)?.sql,"ROLLBACK");
 assert.equal(queries.some(q=>q.sql.includes("INSERT INTO public.smn_member_assignment_version")),false);
});
test("affectation absente : aucune création implicite et rollback",async()=>{
 const {db,queries}=fixture({assignment:false});
 assert.deepEqual(await saveTeamAssignmentRevision(db,
  {accountId:"admin",role:"admin"},memberId,valid),
  {ok:false,error:"assignment-not-active"});
 assert.equal(queries.at(-1)?.sql,"ROLLBACK");
 assert.equal(queries.some(q=>q.sql.startsWith("INSERT")),false);
});
test("date dépassée ou antérieure à une version future : refus",async()=>{
 const past=fixture();
 assert.deepEqual(await saveTeamAssignmentRevision(past.db,
  {accountId:"admin",role:"admin"},memberId,{...valid,effectiveFrom:"2026-10-26"}),
  {ok:false,error:"date-in-past"});
 const future=fixture({latestDate:"2026-11-01"});
 assert.deepEqual(await saveTeamAssignmentRevision(future.db,
  {accountId:"admin",role:"admin"},memberId,valid),
  {ok:false,error:"date-before-latest"});
});
test("membre archivé et équipe inexistante : aucune mutation",async()=>{
 const archived=fixture({archived:true});
 assert.deepEqual(await saveTeamAssignmentRevision(archived.db,
  {accountId:"admin",role:"admin"},memberId,valid),{ok:false,error:"archived"});
 const foreign=fixture({team:false});
 await assert.rejects(()=>saveTeamAssignmentRevision(foreign.db,
  {accountId:"admin",role:"admin"},memberId,valid),/team-context-unavailable/);
 assert.equal(foreign.queries.at(-1)?.sql,"ROLLBACK");
});
test("compte user et formulaire invalide échouent avant ouverture de transaction",async()=>{
 const user=fixture();
 await assert.rejects(()=>saveTeamAssignmentRevision(user.db,
  {accountId:"user",role:"user"},memberId,valid),/team-access-forbidden/);
 assert.equal(user.queries.length,0);
 const malformed=fixture();
 assert.deepEqual(await saveTeamAssignmentRevision(malformed.db,
  {accountId:"admin",role:"admin"},memberId,{...valid,revision:0}),
  {ok:false,error:"invalid-input"});
 assert.equal(malformed.queries.length,0);
});
test("erreur PostgreSQL : rollback et jamais de commit",async()=>{
 const {db,queries}=fixture({writeFailure:true});
 await assert.rejects(()=>saveTeamAssignmentRevision(db,
  {accountId:"admin",role:"admin"},memberId,valid),/simulated-postgres-failure/);
 assert.equal(queries.at(-1)?.sql,"ROLLBACK");
 assert.equal(queries.some(q=>q.sql==="COMMIT"),false);
});
