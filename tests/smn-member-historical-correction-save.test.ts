import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {correctHistoricalTeamAssignment} from "../src/server/members/team-assignment-historical-correction";

const member="123e4567-e89b-42d3-a456-426614174000";
const team="team_koala",assignment="assignment_1",account="admin";
const input={memberId:member,teamId:team,effectiveFrom:"2026-01-01",
 contractPercent:100,allocationPercent:80,contributionPercent:100,
 shares:{scrumMaster:0,productOwner:80,developer:20},revision:2};
function fake(options:{revision?:number;archived?:boolean;ended?:boolean}={}){
 const sql:string[]=[];
 const query=async(text:string,params:unknown[]=[])=>{
  sql.push(text);
  if(text==="BEGIN"||text==="COMMIT"||text==="ROLLBACK")return {rows:[]};
  if(text.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:33}]};
  if(text.includes("FROM public.smn_account_team_preference"))
   return {rows:[{team_id:team}]};
  if(text.includes("SELECT p.id AS product_id"))
   return {rows:[{product_id:null,product:null,team_id:team,team:"Koala",mode:"scrum"}]};
  if(text.includes("SELECT archived_at::text AS archived_at FROM public.smn_member"))
   return {rows:[{archived_at:options.archived?"2026-04-01":null}]};
  if(text.includes("SELECT id,start_on::text,end_on::text FROM public.smn_member_assignment"))
   return {rows:options.ended===false?[]:[{id:assignment,start_on:"2026-01-01",end_on:"2026-03-23"}]};
  if(text.includes("SELECT revision FROM public.smn_member_assignment_version"))
   return {rows:[{revision:options.revision??2}]};
  if(text.includes("SELECT id FROM public.smn_member_assignment_version"))
   return {rows:[{id:"existing_version"}]};
  if(text.includes("INSERT INTO public.smn_member_assignment_version")){
   assert.equal(params[1],assignment);
   assert.equal(params[2],3);
   assert.equal(params[6],"2026-01-01");
   return {rows:[]};
  }
  throw Error("Unexpected SQL "+text);
 };
 return {db:{query} as unknown as Client,sql};
}

test("une affectation terminée peut enregistrer une correction de rôles historisée",async()=>{
 const {db,sql}=fake();
 const result=await correctHistoricalTeamAssignment(db,
  {accountId:account,role:"admin"},member,input);
 assert.deepEqual(result,{ok:true,revision:3,assignmentId:assignment,teamId:team});
 assert.equal(sql.filter(q=>q.includes("INSERT INTO public.smn_member_assignment_version")).length,1);
 assert.ok(sql.includes("COMMIT"));
 assert.ok(!sql.some(q=>/UPDATE public\.smn_member_assignment\s|DELETE FROM public\.smn_member_assignment_version/.test(q)));
});
test("révision concurrente : aucune écriture, retour conflict",async()=>{
 const {db,sql}=fake({revision:3});
 const result=await correctHistoricalTeamAssignment(db,{accountId:account,role:"admin"},member,input);
 assert.deepEqual(result,{ok:false,error:"conflict"});
 assert.ok(sql.includes("ROLLBACK"));
 assert.ok(!sql.some(q=>q.includes("INSERT INTO public.smn_member_assignment_version")));
});
test("date hors affectation : le refus est explicite",async()=>{
 const {db}=fake({ended:false});
 const result=await correctHistoricalTeamAssignment(db,{accountId:account,role:"admin"},member,input);
 assert.deepEqual(result,{ok:false,error:"outside-assignment"});
});
