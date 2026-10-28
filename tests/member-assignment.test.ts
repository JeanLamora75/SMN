import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseAssignmentInput,readMemberAssignment,saveMemberAssignment,developerShareFraction} from "../src/server/members/assignment";
import {ASSIGNMENT_MIGRATION_SQL} from "../src/server/members/assignment-migration";

const memberId=randomUUID();
const initial={memberId,teamId:"team",effectiveFrom:"2026-10-22",contractPercent:100,allocationPercent:80,
 contributionPercent:70,shares:{scrumMaster:30,productOwner:0,developer:70},revision:1};
const row={id:"assignment-one",member_id:memberId,team_id:"team",start_on:"2026-10-20",end_on:null};
const version={revision:1,effective_from:"2026-10-20",contract_percent:100,allocation_percent:100,
 contribution_percent:100,scrum_master_percent:100,product_owner_percent:0,developer_percent:0};
function dbFixture(options:{missing?:boolean;noAssignment?:boolean;closed?:boolean;conflict?:boolean;future?:boolean;failWrite?:boolean}={}){
 const queries:string[]=[],params:unknown[][]=[];
 const db={query:async(sql:string,values:unknown[]=[])=>{
  queries.push(sql);params.push(values);
  if(sql.includes("CURRENT_DATE::text AS today"))return {rows:[{today:"2026-10-21"}],rowCount:1};
  if(sql.includes("FROM public.smn_member WHERE id=$1"))return {rows:options.missing?[]:[{id:memberId,contract_percent:100}],rowCount:options.missing?0:1};
  if(sql.includes("FROM public.smn_team t"))return {rows:[{id:"team"}],rowCount:1};
  if(sql.includes("FROM public.smn_member_assignment WHERE member_id=$1"))
   return {rows:options.noAssignment?[]:[{...row,end_on:options.closed?"2026-10-21":null}],rowCount:options.noAssignment?0:1};
  if(sql.includes("FROM public.smn_member_assignment_version WHERE assignment_id=$1")){
   if(options.noAssignment)return {rows:[],rowCount:0};
   return {rows:[{...version,revision:options.conflict?2:1,effective_from:options.future?"2026-11-01":version.effective_from}],rowCount:1};
  }
  if(sql.includes("INSERT INTO public.smn_member_assignment_version")){
   if(options.failWrite)throw new Error("db-write-failed");
   return {rows:[],rowCount:1};
  }
  if(sql.includes("INSERT INTO public.smn_member_assignment\n")){
   if(options.failWrite)throw new Error("db-write-failed");
   return {rows:[],rowCount:1};
  }
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,queries,params};
}
describe("Affectations et rôles Agile à effet daté",()=>{
 it("validation stricte: total des rôles 100 %, dates, équipe et affectation <= temps contractuel",()=>{
  assert.deepEqual(parseAssignmentInput(initial),initial);
  for(const invalid of [
   {...initial,shares:{...initial.shares,developer:69}},
   {...initial,shares:{...initial.shares,developer:71}},
   {...initial,allocationPercent:101},
   {...initial,allocationPercent:91,contractPercent:90},
   {...initial,contractPercent:30,allocationPercent:40},
   {...initial,contributionPercent:-1},
   {...initial,shares:{scrumMaster:100,developer:0}},
   {...initial,effectiveFrom:"2026-02-31"},
   {...initial,effectiveFrom:"2026-10-22T00:00:00Z"},
   {...initial,teamId:"second-team/unsafe"},
   {...initial,revision:-1},
   {...initial,extra:true}
  ])assert.equal(parseAssignmentInput(invalid),null);
 });
 it("une part développeur nulle ne produit aucune contribution développeur",()=>{
  assert.equal(developerShareFraction({scrumMaster:100,productOwner:0,developer:0}),0);
  assert.equal(developerShareFraction({scrumMaster:0,productOwner:100,developer:0}),0);
  assert.equal(developerShareFraction({scrumMaster:30,productOwner:0,developer:70}),0.7);
 });
 it("versionnement initial et chaque taux conservés dans des colonnes indépendantes",()=>{
  assert.match(ASSIGNMENT_MIGRATION_SQL,/CREATE TABLE public.smn_member_assignment_version/);
  assert.match(ASSIGNMENT_MIGRATION_SQL,/scrum_master_percent \+ product_owner_percent \+ developer_percent = 100/);
  assert.match(ASSIGNMENT_MIGRATION_SQL,/contribution_percent integer NOT NULL/);
  assert.match(ASSIGNMENT_MIGRATION_SQL,/INSERT INTO public.smn_member_assignment_version/);
  assert.match(ASSIGNMENT_MIGRATION_SQL,/schema_version=11/);
  assert.doesNotMatch(ASSIGNMENT_MIGRATION_SQL,/DELETE FROM public.smn_member_assignment|DROP TABLE/);
 });
 it("crée une version datée sans UPDATE/DELETE de l'historique précédent",async()=>{
  const {db,queries,params}=dbFixture();
  const result=await saveMemberAssignment(db,memberId,"actor",{...initial});
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.created,false);assert.equal(result.revision,2);}
  assert.equal(queries.at(-1),"COMMIT");
  assert.equal(queries.filter(q=>q.includes("INSERT INTO public.smn_member_assignment_version")).length,1);
  assert.ok(queries.every(q=>!q.includes("UPDATE public.smn_member_assignment_version")&&!q.includes("DELETE FROM public.smn_member_assignment_version")));
  const i=queries.findIndex(q=>q.includes("INSERT INTO public.smn_member_assignment_version"));
  assert.equal(params[i][3],80);
  assert.equal(params[i][4],100);
  assert.equal(params[i][5],70);
 });
 it("création d'affectation si le membre central n'en a aucune, sans seconde équipe",async()=>{
  const {db,queries}=dbFixture({noAssignment:true});
  const result=await saveMemberAssignment(db,memberId,"actor",{...initial,revision:0});
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.created,true);assert.equal(result.revision,1);}
  assert.equal(queries.filter(q=>q.includes("INSERT INTO public.smn_member_assignment\n")).length,1);
  assert.equal(queries.filter(q=>q.includes("INSERT INTO public.smn_member_assignment_version")).length,1);
  assert.ok(!queries.some(q=>q.includes("INSERT INTO public.smn_team")||q.includes("INSERT INTO public.smn_member\n")));
 });
 it("refuse équipe différente, conflit de version, date antérieure et membre absent",async()=>{
  const other=dbFixture();
  assert.deepEqual(await saveMemberAssignment(other.db,memberId,"actor",{...initial,teamId:"other"}),{ok:false,error:"team-unavailable"});
  const stale=dbFixture({conflict:true});
  assert.deepEqual(await saveMemberAssignment(stale.db,memberId,"actor",initial),{ok:false,error:"conflict"});
  const back=dbFixture();
  assert.deepEqual(await saveMemberAssignment(back.db,memberId,"actor",{...initial,effectiveFrom:"2026-10-19"}),{ok:false,error:"date-in-past"});
  const missing=dbFixture({missing:true});
  assert.deepEqual(await saveMemberAssignment(missing.db,memberId,"actor",initial),{ok:false,error:"not-found"});
  for(const trace of [other,stale,back,missing]){
   assert.equal(trace.queries.at(-1),"ROLLBACK");
   assert.ok(!trace.queries.some(q=>q.includes("INSERT INTO public.smn_member_assignment_version")));
  }
 });
 it("refuse une date antérieure à la dernière version future",async()=>{
  const f=dbFixture({future:true});
  const result=await saveMemberAssignment(f.db,memberId,"actor",initial);
  assert.deepEqual(result,{ok:false,error:"date-before-latest"});
  assert.equal(f.queries.at(-1),"ROLLBACK");
 });
 it("une personne réactivée reçoit une nouvelle affectation sans effacer l'ancienne",async()=>{
  const f=dbFixture({closed:true});
  const result=await saveMemberAssignment(f.db,memberId,"actor",{...initial,revision:0});
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.created,true);assert.equal(result.revision,1);}
  assert.ok(f.queries.some(q=>q.includes("INSERT INTO public.smn_member_assignment")));
  assert.ok(f.queries.every(q=>!q.includes("DELETE FROM public.smn_member_assignment")));
  const reread=dbFixture({closed:true});
  const state=await readMemberAssignment(reread.db,memberId);
  assert.equal(state.assignmentId,null);
  assert.equal(state.latestRevision,0);
 });
 it("erreur SQL => ROLLBACK atomique",async()=>{
  const f=dbFixture({failWrite:true});
  await assert.rejects(()=>saveMemberAssignment(f.db,memberId,"actor",initial),/db-write-failed/);
  assert.equal(f.queries.at(-1),"ROLLBACK");
 });
 it("lecture privée reprend l'équipe singleton et l'ensemble des versions",async()=>{
  const f=dbFixture();
  const result=await readMemberAssignment(f.db,memberId);
  assert.equal(result.teamId,"team");
  assert.equal(result.versions.length,1);
  assert.equal(result.versions[0].shares.scrumMaster,100);
 });
});
