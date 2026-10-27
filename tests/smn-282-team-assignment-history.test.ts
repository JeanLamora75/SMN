import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {readTeamAssignmentHistory} from "../src/server/members/team-assignment-history";

const memberId="123e4567-e89b-42d3-a456-426614174000";
function fake(found=true){
 const statements:{sql:string;args:unknown[]}[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  statements.push({sql,args});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))return {
   rows:[{installation_id:"singleton",schema_version:28}]
  };
  if(sql.includes("SELECT t.id AS team_id FROM public.smn_account_team_preference"))
   return {rows:[{team_id:"other_team"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:[{team_id:"team_b",team:"Panda",product_id:null,
    product:null,mode:"scrum"}]};
  if(sql.includes("SELECT a.id AS assignment_id"))
   return {rows:found?[{
    assignment_id:"assignment_panda",start_on:"2026-01-01",end_on:"2026-03-31",
    revision:2,effective_from:"2026-02-01",
    contract_percent:100,allocation_percent:80,contribution_percent:80,
    scrum_master_percent:0,product_owner_percent:0,developer_percent:100
   }]:[]};
  throw Error("Unexpected query");
 }} as unknown as Client;
 return {db,statements};
}
test("seules les versions de l'affectation dans l'équipe cible sont retournées",async()=>{
 const {db,statements}=fake();
 const result=await readTeamAssignmentHistory(db,
  {accountId:"admin",role:"admin"},memberId,"team_b");
 assert.equal(result.memberId,memberId);
 assert.equal(result.teamId,"team_b");
 assert.equal(result.versions.length,1);
 assert.equal(result.versions[0].assignmentId,"assignment_panda");
 assert.equal(result.versions[0].revision,2);
 const scoped=statements.find(q=>q.sql.includes("SELECT a.id AS assignment_id"));
 assert.deepEqual(scoped?.args,[memberId,"team_b"]);
 assert.match(scoped!.sql,/a.member_id=\$1 AND a.team_id=\$2/);
 assert.match(scoped!.sql,/v.assignment_id=a.id/);
 assert.match(scoped!.sql,/m.installation_id=t.installation_id/);
 assert.doesNotMatch(scoped!.sql,/smn_member_identity_history|smn_member_absence_history/);
});
test("une équipe sans affectation n'obtient aucun historique personnel",async()=>{
 const {db}=fake(false);
 await assert.rejects(()=>readTeamAssignmentHistory(db,
  {accountId:"admin",role:"admin"},memberId,"team_b"),/member-out-of-team/);
});
test("compte user, membre invalide et ID d'équipe forgé sont refusés",async()=>{
 const m=fake();
 await assert.rejects(()=>readTeamAssignmentHistory(m.db,
  {accountId:"user",role:"user"},memberId,"team_b"),/team-access-forbidden/);
 assert.equal(m.statements.length,0);
 await assert.rejects(()=>readTeamAssignmentHistory(m.db,
  {accountId:"admin",role:"admin"},"unknown","team_b"),
  /team-assignment-history-invalid-input/);
 await assert.rejects(()=>readTeamAssignmentHistory(m.db,
  {accountId:"admin",role:"admin"},memberId,"../../team"),
  /team-assignment-history-invalid-input/);
 assert.equal(m.statements.length,0);
});
