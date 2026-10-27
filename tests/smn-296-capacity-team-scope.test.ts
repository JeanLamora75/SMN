import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {readDevelopmentCapacity} from "../src/server/capacity/engine";

test("le moteur de capacité refuse une équipe archivée avant toute lecture membre",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("SELECT t.id,t.name,CASE WHEN i.schema_version=29"))
   return {rows:[]};
  throw Error("Unexpected SQL");
 }} as unknown as Client;
 await assert.rejects(()=>readDevelopmentCapacity(db,"2026-11-02","2026-11-13",
  {teamId:"archived_team",externalTransaction:true}),/capacity-team-unavailable/);
 assert.equal(statements.some(s=>s.includes("FROM public.smn_member_assignment a")),false);
 assert.ok(statements[0].includes("is_archived"));
});
test("invalid team identifier never reaches the database",async()=>{
 const db={query:async()=>{throw Error("should-not-query");}} as unknown as Client;
 await assert.rejects(()=>readDevelopmentCapacity(db,"2026-11-02","2026-11-13",
  {teamId:"../other",externalTransaction:true}),/capacity-team-invalid/);
});
