import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {validRelationTarget,changeRelation} from "../src/server/registries/relations";
const source="11111111-1111-4111-8111-111111111111",target="22222222-2222-4222-8222-222222222222";
test("reject malformed/self relations",async()=>{
 assert.equal(validRelationTarget({kind:"record",id:target}),true);
 assert.equal(validRelationTarget({kind:"unknown",id:target}),false);
 assert.deepEqual(await changeRelation({} as Client,"admin",source,{kind:"record",id:source},"linked"),{ok:false,error:"invalid-input"});
});
test("commit validated relationship with append-only audit",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);
  if(/^SELECT to_regclass\('public\.[^']+'\) AS present$/.test(q))return {rows:[{present:"migrated"}]};
  if(q.includes("SELECT r.team_id,r.type"))return {rows:[{team_id:"team1",type:"action"}]};
  if(q.includes("SELECT r.id,r.type"))return {rows:[{id:target,type:"obstacle"}]};
  return {rows:[]};
 }} as unknown as Client;
 assert.deepEqual(await changeRelation(db,"admin",source,{kind:"record",id:target},"linked"),{ok:true});
 assert.ok(sql.some(x=>x.includes("smn_registry_relation_audit")));
 assert.equal(sql.at(-1),"COMMIT");
 assert.ok(!sql.some(x=>x.includes("UPDATE public.smn_sprint_goal")||x.includes("UPDATE public.smn_registry_item")));
});
test("reject forbidden goals without mutations",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);
  if(/^SELECT to_regclass\('public\.[^']+'\) AS present$/.test(q))return {rows:[{present:"migrated"}]};return {rows:q.includes("SELECT r.team_id,r.type")?[{team_id:"team1",type:"risk"}]:[]};}} as unknown as Client;
 const r=await changeRelation(db,"admin",source,{kind:"goal",id:target},"linked");
 assert.deepEqual(r,{ok:false,error:"incompatible"});
 assert.equal(sql.at(-1),"ROLLBACK");
});
