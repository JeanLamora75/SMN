import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {resolveReportLanguage,isReportLanguage} from "../src/lib/report-language";
import {readReportLanguage,saveReportLanguage} from "../src/server/reports/language";
test("report locale is explicit, unknown locale falls back to French",()=>{
 assert.equal(resolveReportLanguage("en"),"en");assert.equal(resolveReportLanguage("de"),"fr");
 assert.equal(isReportLanguage("fr"),true);assert.equal(isReportLanguage("DE"),false);
});
test("missing language table defaults to French without writes",async()=>{
 const sql:string[]=[];const db={query:async(q:string)=>{sql.push(q);return {rows:[{present:false}]};}} as unknown as Client;
 const v=await readReportLanguage(db,"11111111-1111-4111-8111-111111111111");
 assert.deepEqual(v,{language:"fr",revision:0});assert.equal(sql.length,1);
});
test("invalid language cannot be persisted",async()=>{
 const db={query:async()=>{throw Error("unexpected SQL");}} as unknown as Client;
 const v=await saveReportLanguage(db,"11111111-1111-4111-8111-111111111111","admin",{language:"es",revision:0});
 assert.deepEqual(v,{ok:false,error:"invalid-input"});
});
