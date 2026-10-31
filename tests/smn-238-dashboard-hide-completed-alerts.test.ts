import assert from "node:assert/strict";
import test from "node:test";
import type {Client} from "pg";
import {readCycleNotesAndAlerts} from "../src/server/dashboard/attention-reader";

type QueryResult={rows:unknown[]};
function fakeDb(configStatuses:string[],noteStatuses:string[]):Client{
 const db={query:async(sql:string,params?:unknown[]):Promise<QueryResult>=>{
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  if(sql.includes("FROM public.smn_dashboard_note n")){
   assert.deepEqual(params,["team-1","sprint-1"]);
   assert.match(sql,/n.status\s*<>\s*'done'/);
   return {rows:noteStatuses.filter(s=>s!=="done").map((status,i)=>({id:"note-"+i,body:"Note "+i,status}))};
  }
  if(sql.includes("FROM public.smn_configuration_task")){
   assert.match(sql,/status\s*=\s*'todo'/);
   return {rows:configStatuses.filter(s=>s==="todo").map((status,i)=>({
    task_key:["reference-country","recovery-phrase","display-preferences"][i%3],status
   }))};
  }
  throw new Error("Unexpected query: "+sql);
 }};
 return db as unknown as Client;
}

test("SMN-238: completed configuration tasks and notes are not counted",async()=>{
 const result=await readCycleNotesAndAlerts(fakeDb(["done","done","done"],["done"]),"team-1","sprint-1");
 assert.equal(result.state,"available");
 if(result.state!=="available")return;
 assert.equal(result.total,0);
 assert.deepEqual(result.items,[]);
});

test("SMN-238: active alerts and open notes alone remain visible",async()=>{
 const result=await readCycleNotesAndAlerts(fakeDb(["todo","done"],["open","done"]),"team-1","sprint-1");
 assert.equal(result.state,"available");
 if(result.state!=="available")return;
 assert.equal(result.total,2);
 assert.equal(result.items.length,2);
 assert.deepEqual(result.items.map(item=>item.status),["todo","open"]);
});
