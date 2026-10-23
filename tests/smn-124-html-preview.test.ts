import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {composeHtmlReportPreview} from "../src/server/reports/html-preview";
test("preview rejects unknown Sprint without writing anything",async()=>{
 const sql:string[]=[];
 const db={query:async(q:string)=>{sql.push(q);return {rows:[]};}} as unknown as Client;
 const result=await composeHtmlReportPreview(db,"11111111-1111-4111-8111-111111111111");
 assert.equal(result,null);
 assert.ok(sql.every(q=>/^\s*SELECT/i.test(q)));
});
