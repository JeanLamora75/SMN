import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {qualitativeClosureSnapshot} from "../src/server/registries/closure-snapshot";
test("absence de socle qualitatif signalée sans inventer de fiches",async()=>{
 const db={query:async()=>({rows:[{items:false,links:false,relations:false,selections:false,events:false,invalidated:false}]})} as unknown as Client;
 const result=await qualitativeClosureSnapshot(db,"sprint","team");
 assert.equal(result.state,"not-installed");
 assert.deepEqual(result.items,[]);
});
test("capture les fiches liées et leurs informations sans mutation",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);
  if(q.includes("to_regclass"))return {rows:[{items:true,links:true,relations:false,selections:false,events:false,invalidated:false}]};
  if(q.includes("FROM public.smn_registry_cycle_link l"))return {rows:[{id:"risk1",type:"risk",title:"Risk",status:"open",revision:2}]};
  return {rows:[]};
 }} as unknown as Client;
 const result=await qualitativeClosureSnapshot(db,"sprint","team");
 assert.equal(result.state,"captured");assert.equal(result.items.length,1);
 assert.ok(!sql.some(q=>/UPDATE|DELETE|INSERT/.test(q)));
});
