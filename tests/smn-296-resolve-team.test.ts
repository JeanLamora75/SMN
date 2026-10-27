import assert from "node:assert/strict";
import test from "node:test";
import type {Client} from "pg";
import {resolveAdminTeam} from "../src/server/teams/resolve";

function fakeDb(version:number, archivedPreference:boolean, archivedSelection:boolean){
 const statements:string[]=[];
 const query=async (sql:string,values:unknown[]=[])=>{
  statements.push(sql);
  if(sql.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:version}]};
  if(sql.includes("FROM public.smn_account_team_preference")){
   assert.equal(values[2],version);
   return {rows:archivedPreference?[]:[{team_id:"team_a"}]};
  }
  if(sql.includes("LEFT JOIN public.smn_product")){
   assert.equal(values[2],version);
   if(archivedSelection && sql.includes("t.is_archived=false"))return {rows:[]};
   return {rows:[{team_id:"team_a",team:"Team A",product_id:null,product:null,mode:"scrum"}]};
  }
  throw Error("Unexpected SQL");
 };
 return {db:{query} as unknown as Client,statements};
}

test("v29: archived preferred team is never selected implicitly",async()=>{
 const {db,statements}=fakeDb(29,true,false);
 await assert.rejects(()=>resolveAdminTeam(db,{accountId:"admin",role:"admin"}),/team-context-unavailable/);
 assert.ok(statements.some(s=>s.includes("t.is_archived=false")));
});

test("v29: explicit archived team is denied",async()=>{
 const {db}=fakeDb(29,false,true);
 await assert.rejects(()=>resolveAdminTeam(db,{accountId:"admin",role:"admin"},"team_a"),/team-context-unavailable/);
});

test("v29: account with user role never resolves admin context",async()=>{
 const {db,statements}=fakeDb(29,false,false);
 await assert.rejects(()=>resolveAdminTeam(db,{accountId:"admin",role:"user"}),/team-access-forbidden/);
 assert.deepEqual(statements,[]);
});

test("v28: legacy active team resolution remains possible",async()=>{
 const {db}=fakeDb(28,false,false);
 const result=await resolveAdminTeam(db,{accountId:"admin",role:"admin"},"team_a");
 assert.equal(result.team_id,"team_a");
});
