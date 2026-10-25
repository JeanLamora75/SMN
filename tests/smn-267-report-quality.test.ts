import test from "node:test";
import assert from "node:assert/strict";
import {inspectDocumentQuality} from "../src/lib/report-export-quality";
test("hidden optional section does not trigger missing metric warning",()=>{
 const issues=inspectDocumentQuality({sections:[{key:"indicators",visible:false}],metrics:{committedSp:{value:null,unit:"SP"}}});
 assert.equal(issues.some(i=>i.code==="unavailable-data"),false);
});
test("AI analysis is informative, not a technical error",()=>{
 const issues=inspectDocumentQuality({analyses:[{origin:"ai"}]});
 assert.deepEqual(issues.find(i=>i.code==="analysis-origin")?.severity,"warning");
});
