import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {standardReportTemplate,validReportTemplate} from "../src/lib/report-templates";
import {manageReportTemplate} from "../src/server/reports/templates";
test("protected Standard and editable six-section clone",()=>{
 const standard=standardReportTemplate();
 assert.equal(standard.protected,true);assert.equal(standard.sections.length,6);
 const copy={...standard,id:"copy-1",name:"Direction",protected:false,revision:1,historyDepth:3};
 assert.equal(validReportTemplate(copy),true);
 assert.equal(validReportTemplate({...copy,historyDepth:6}),false);
});
test("protected template cannot be changed or deleted, no SQL",async()=>{
 const db={query:async()=>{throw Error("should not query");}} as unknown as Client;
 assert.deepEqual(await manageReportTemplate(db,"admin",{action:"delete",id:"standard"}),{ok:false,error:"protected"});
 assert.deepEqual(await manageReportTemplate(db,"admin",{action:"update",id:"standard",template:standardReportTemplate()}),{ok:false,error:"protected"});
});
