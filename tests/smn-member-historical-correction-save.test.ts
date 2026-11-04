import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {correctHistoricalTeamAssignment} from "../src/server/members/team-assignment-historical-correction";
import {cancelLatestTeamAssignmentRevision} from "../src/server/members/team-assignment-revision-cancel";

const member="123e4567-e89b-42d3-a456-426614174000";
const assignment="123e4567-e89b-42d3-a456-426614174111",team="team_koala";
const actor={accountId:"admin",role:"admin" as const};
const input={memberId:member,teamId:team,effectiveFrom:"2026-01-01",
 contractPercent:100,allocationPercent:80,contributionPercent:100,
 shares:{scrumMaster:0,productOwner:80,developer:20},revision:2,targetRevision:1};
function fake(opts:{latest?:number;frozen?:boolean;noAssignment?:boolean;sameRoles?:boolean}={}){
 const queries:{sql:string;params:unknown[]}[]=[];
 const query=async(sql:string,params:unknown[]=[])=>{
  queries.push({sql,params});
  if(["BEGIN","COMMIT","ROLLBACK"].includes(sql))return {rows:[],rowCount:0};
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:33}]};
  if(sql.includes("FROM public.smn_account_team_preference"))
   return {rows:[{team_id:team}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:team,team:"Koala",mode:"scrum"}]};
  if(sql.includes("SELECT archived_at::text AS archived_at FROM public.smn_member"))
   return {rows:[{archived_at:null}]};
  if(sql.includes("FROM public.smn_member_assignment")&&!sql.includes("version"))
   return {rows:opts.noAssignment?[]:[{id:assignment,start_on:"2026-01-01",end_on:"2026-03-23"}]};
  if(sql.includes("FROM public.smn_member_assignment_version")&&sql.includes("SELECT *"))
   return {rows:[
    {id:"version2",revision:opts.latest??2,effective_from:"2026-01-01",
     allocation_percent:100,contract_percent:100,contribution_percent:100,
     scrum_master_percent:0,product_owner_percent:100,developer_percent:0},
    {id:"version1",revision:1,effective_from:"2026-01-01",
     allocation_percent:100,contract_percent:100,contribution_percent:100,
     scrum_master_percent:0,product_owner_percent:opts.sameRoles?100:0,developer_percent:opts.sameRoles?0:100}
   ]};
  if(sql.includes("FROM public.smn_sprint s"))return {rows:opts.frozen?[{one:1}]:[]};
  if(sql.includes("FROM public.smn_capacity_initial_snapshot"))return {rows:opts.frozen?[{one:1}]:[]};
  if(sql.includes("FROM public.smn_report_pdf_archive"))return {rows:[]};
  if(sql.includes("INSERT INTO public.smn_member_lifecycle_event"))return {rows:[],rowCount:1};
  if(sql.includes("UPDATE public.smn_member_assignment_version"))return {rows:[],rowCount:1};
  if(sql.includes("DELETE FROM public.smn_member_assignment_version"))return {rows:[],rowCount:1};
  throw Error("Unexpected SQL "+sql);
 };
 return {db:{query} as unknown as Client,queries};
}

test("corriger la révision 1 n'ajoute aucune révision 3 : audit puis UPDATE ciblé",async()=>{
 const {db,queries}=fake();
 const result=await correctHistoricalTeamAssignment(db,actor,member,input);
 assert.deepEqual(result,{ok:true,revision:1,assignmentId:assignment,teamId:team,corrected:true});
 assert.equal(queries.filter(q=>q.sql.includes("UPDATE public.smn_member_assignment_version")).length,1);
 assert.equal(queries.filter(q=>q.sql.includes("INSERT INTO public.smn_member_assignment_version")).length,0);
 const audit=queries.find(q=>q.sql.includes("INSERT INTO public.smn_member_lifecycle_event"));
 assert.ok(audit);
 assert.equal(JSON.parse(String(audit.params[5])).kind,"assignment-version-correction");
 assert.ok(queries.findIndex(q=>q.sql.includes("INSERT INTO public.smn_member_lifecycle_event"))<
  queries.findIndex(q=>q.sql.includes("UPDATE public.smn_member_assignment_version")));
 assert.ok(queries.some(q=>q.sql==="COMMIT"));
});
test("conflit de révision : aucun UPDATE",async()=>{
 const {db,queries}=fake({latest:3});
 const result=await correctHistoricalTeamAssignment(db,actor,member,input);
 assert.deepEqual(result,{ok:false,error:"conflict"});
 assert.ok(queries.some(q=>q.sql==="ROLLBACK"));
 assert.ok(!queries.some(q=>q.sql.includes("UPDATE public.smn_member_assignment_version")));
});
test("snapshot figé : aucune correction même historique",async()=>{
 const {db,queries}=fake({frozen:true});
 const result=await correctHistoricalTeamAssignment(db,actor,member,{...input,targetRevision:2});
 assert.deepEqual(result,{ok:false,error:"frozen-period"});
 assert.ok(!queries.some(q=>q.sql.includes("UPDATE public.smn_member_assignment_version")));
});
test("annuler dernière révision : audit avant suppression effective et aucune renumérotation",async()=>{
 const {db,queries}=fake();
 const result=await cancelLatestTeamAssignmentRevision(db,actor,member,
  {assignmentId:assignment,teamId:team,revision:2});
 assert.deepEqual(result,{ok:true,cancelledRevision:2,restoredRevision:1});
 const audit=queries.find(q=>q.sql.includes("INSERT INTO public.smn_member_lifecycle_event"));
 assert.ok(audit);
 assert.equal(JSON.parse(String(audit.params[5])).kind,"assignment-version-cancellation");
 assert.ok(queries.findIndex(q=>q.sql.includes("INSERT INTO public.smn_member_lifecycle_event"))<
  queries.findIndex(q=>q.sql.includes("DELETE FROM public.smn_member_assignment_version")));
});
test("annulation d'une révision non dernière ou d'un historique figé refusée",async()=>{
 const {db,queries}=fake();
 assert.deepEqual(await cancelLatestTeamAssignmentRevision(db,actor,member,
  {assignmentId:assignment,teamId:team,revision:1}),{ok:false,error:"invalid-input"});
 assert.ok(!queries.some(q=>q.sql.includes("DELETE FROM public.smn_member_assignment_version")));
 const f=fake({frozen:true});
 assert.deepEqual(await cancelLatestTeamAssignmentRevision(f.db,actor,member,
  {assignmentId:assignment,teamId:team,revision:2}),{ok:false,error:"frozen-period"});
});

test("correction d'une version masquée par une plus récente : audit permis sans toucher aux capacités figées",async()=>{
 const {db,queries}=fake({frozen:true});
 const result=await correctHistoricalTeamAssignment(db,actor,member,input);
 assert.equal(result.ok,true);
 assert.ok(!queries.some(q=>q.sql.includes("FROM public.smn_sprint s")));
});
test("annulation d'une dernière révision redondante possible même avec un snapshot figé",async()=>{
 const {db,queries}=fake({frozen:true,sameRoles:true});
 const result=await cancelLatestTeamAssignmentRevision(db,actor,member,
  {assignmentId:assignment,teamId:team,revision:2});
 assert.equal(result.ok,true);
 assert.ok(!queries.some(q=>q.sql.includes("FROM public.smn_sprint s")));
});
