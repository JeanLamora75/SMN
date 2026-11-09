import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {inspectMemberForeignKeys} from "../src/server/backup/erasure-fk-discovery";

test("SMN-38: composite foreign keys are traversed and counted",async()=>{
 const fake={
  query:async(_sql:string,params:unknown[])=>{
   if(params[0]===1501)return {rows:[
    {child_table:"smn_member_assignment",parent_table:"smn_member",
     child_columns:["member_id"],parent_columns:["id"]},
    {child_table:"smn_personal_composite",parent_table:"smn_member",
     child_columns:["member_id","installation_id"],parent_columns:["id","installation_id"]}
   ]};
   return {rows:[{n:"2"}]};
  }
 } as unknown as Client;
 const actual=await inspectMemberForeignKeys(fake,"member-001");
 assert.equal(actual.find(x=>x.table==="smn_member_assignment")?.count,2);
 assert.deepEqual(actual.find(x=>x.table==="smn_personal_composite"),{
  table:"smn_personal_composite",category:"associations",
  scope:"direct",count:2,state:"inspected"
 });
});
test("SMN-38: FK chains beyond the explored depth produce an explicit gap",async()=>{
 const edges=[
  {child_table:"smn_member_assignment",parent_table:"smn_member"},
  {child_table:"smn_assignment_detail",parent_table:"smn_member_assignment"},
  {child_table:"smn_assignment_revision",parent_table:"smn_assignment_detail"},
  {child_table:"smn_assignment_audit",parent_table:"smn_assignment_revision"}
 ].map(e=>({...e,child_columns:["member_id"],parent_columns:["id"]}));
 const fake={query:async(_sql:string,params:unknown[])=>params[0]===1501?
  {rows:edges}:{rows:[{n:"1"}]}} as unknown as Client;
 const actual=await inspectMemberForeignKeys(fake,"member-001");
 assert.equal(actual.find(x=>x.table==="foreign-key-depth-limit")?.state,"unknown");
});

test("SMN-38: cycle in an FK graph must remain unknown, not be silently skipped",async()=>{
 const fake={query:async(_sql:string,params:unknown[])=>params[0]===1501?
  {rows:[{child_table:"smn_member",parent_table:"smn_member",
    child_columns:["parent_id"],parent_columns:["id"]}]}:
  {rows:[{n:"0"}]}} as unknown as Client;
 const result=await inspectMemberForeignKeys(fake,"member-001");
 assert.equal(result.some(row=>row.table==="foreign-key-cycle"&&
  row.state==="unknown"&&row.count===null),true);
});
