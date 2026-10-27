import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readAdminActiveTeam,saveAdminActiveTeam} from "../src/server/teams/active";

test("v29 active team list excludes archived teams",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:29}]};
  if(sql.includes("SELECT id,name FROM public.smn_team"))return {rows:[{id:"team_a",name:"A"}]};
  if(sql.includes("SELECT p.team_id"))return {rows:[{team_id:"team_a"}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await readAdminActiveTeam(db,"admin");
 assert.equal(result?.ready,true);
 assert.equal(result?.teamId,"team_a");
 assert.ok(statements.some(sql=>sql.includes("AND is_archived=false")));
 assert.ok(statements.some(sql=>sql.includes("t.is_archived=false")));
});
test("v29 cannot select an archived team",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("FROM public.smn_account a"))return {rows:[{installation_id:"singleton",schema_version:29}]};
  if(sql.includes("SELECT id FROM public.smn_team"))return {rows:[]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await saveAdminActiveTeam(db,"admin","archived_team");
 assert.deepEqual(result,{ok:false,error:"not-found"});
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.ok(statements.some(sql=>sql.includes("is_archived=false")));
});
