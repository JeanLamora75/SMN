import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {inspectMemberForeignKeys} from "../src/server/backup/erasure-fk-discovery";

test("SMN-38: composite foreign keys are never silently treated as absent",async()=>{
 const fake={
  query:async(_sql:string,params:unknown[])=>{
   if(params[0]===251)return {rows:[
    {child_table:"smn_member_assignment",parent_table:"smn_member",
     child_column:"member_id",parent_column:"id",multi_column:false},
    {child_table:"smn_personal_composite",parent_table:"smn_member",
     child_column:"member_id",parent_column:"id",multi_column:true}
   ]};
   return {rows:[{n:"2"}]};
  }
 } as unknown as Client;
 const actual=await inspectMemberForeignKeys(fake,"member-001");
 assert.equal(actual.find(x=>x.table==="smn_member_assignment")?.count,2);
 assert.deepEqual(actual.find(x=>x.table==="smn_personal_composite"),{
  table:"smn_personal_composite",category:"associations",
  scope:"indirect",count:null,state:"unknown"
 });
});
test("SMN-38: FK chains beyond the explored depth produce an explicit gap",async()=>{
 const edges=[
  {child_table:"smn_member_assignment",parent_table:"smn_member"},
  {child_table:"smn_assignment_detail",parent_table:"smn_member_assignment"},
  {child_table:"smn_assignment_revision",parent_table:"smn_assignment_detail"},
  {child_table:"smn_assignment_audit",parent_table:"smn_assignment_revision"}
 ].map(e=>({...e,child_column:"member_id",parent_column:"id",multi_column:false}));
 const fake={query:async(_sql:string,params:unknown[])=>params[0]===251?
  {rows:edges}:{rows:[{n:"1"}]}} as unknown as Client;
 const actual=await inspectMemberForeignKeys(fake,"member-001");
 assert.equal(actual.find(x=>x.table==="foreign-key-depth-limit")?.state,"unknown");
});
