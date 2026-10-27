import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {saveTeamAssignmentRevision} from "../src/server/members/team-assignment-write";

const memberId="123e4567-e89b-42d3-a456-426614174000";
const input={memberId,teamId:"team_a",effectiveFrom:"2026-11-02",
 contractPercent:100,allocationPercent:80,contributionPercent:100,revision:1,
 shares:{scrumMaster:0,productOwner:0,developer:100}};

test("refuse l'édition quand l'équipe est archivée, avant verrou membre",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:29}]};
  if(sql.includes("FROM public.smn_account_team_preference"))return {rows:[{team_id:"team_a"}]};
  if(sql.includes("LEFT JOIN public.smn_product"))return {rows:[{team_id:"team_a",team:"A",mode:"scrum",product_id:null,product:null}]};
  if(sql.includes("FOR UPDATE OF t"))return {rows:[]};
  throw Error("Unexpected query");
 }} as unknown as Client;
 await assert.rejects(()=>saveTeamAssignmentRevision(db,{accountId:"admin",role:"admin"},
  memberId,input),/team-access-forbidden/);
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.equal(statements.some(s=>s.includes("FOR UPDATE OF m")),false);
 assert.equal(statements.some(s=>s.includes("INSERT INTO public.smn_member_assignment_version")),false);
});
