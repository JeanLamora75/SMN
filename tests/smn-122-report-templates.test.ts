import test from "node:test";
import assert from "node:assert/strict";
import {mayDeleteReportTemplate,standardReportTemplate} from "../src/lib/report-templates";
import {manageReportTemplate} from "../src/server/reports/templates";
import type {Client} from "pg";
test("Standard: six sections, protected, independent defaults",()=>{
 const s=standardReportTemplate();assert.equal(s.sections.length,6);assert.ok(s.sections.every(x=>x.visible));
 assert.equal(s.protected,true);assert.equal(mayDeleteReportTemplate("standard"),false);
 assert.equal(mayDeleteReportTemplate("another"),true);
});
test("server refuses deleting protected Standard without database mutation",async()=>{
 const db={query:async()=>{throw Error("Should not query");}} as unknown as Client;
 const r=await manageReportTemplate(db,"admin",{action:"delete",id:"standard"});
 assert.deepEqual(r,{ok:false,error:"protected"});
});
