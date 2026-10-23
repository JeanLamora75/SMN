import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {applyReportTemplate} from "../src/server/reports/template-application";
test("invalid IDs never begin a write transaction",async()=>{
 const db={query:async()=>{throw Error("unexpected query");}} as unknown as Client;
 assert.deepEqual(await applyReportTemplate(db,"admin","invalid","standard"),{ok:false,error:"invalid-input"});
});
test("missing personalized template rolls back without overwriting draft",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{statements.push(sql);
 if(sql==="BEGIN"||sql==="ROLLBACK")return {rows:[]};
 if(sql.includes("SELECT s.id FROM public.smn_sprint"))return {rows:[{id:"sprint"}]};
 if(sql.includes("to_regclass"))return {rows:[{exists:false}]};
 throw Error("unexpected SQL");
 }} as unknown as Client;
 const result=await applyReportTemplate(db,"admin","11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222");
 assert.deepEqual(result,{ok:false,error:"template-unavailable"});
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.ok(statements.every(sql=>!sql.includes("INSERT INTO")));
});
