import test from "node:test";
import assert from "node:assert/strict";
import {insertSelectedAnalysis,replaceEmbeddedAnalysis,type EmbeddedAnalysis} from "../src/lib/report-embedded-analyses";
const original:EmbeddedAnalysis={sourceId:"analysis-1",archiveId:"archive-1",origin:"ai",scope:"Sprint",content:"Analyse source",selectedAt:"2026-10-25T00:00:00Z"};
test("selection keeps its own copy and provenance",()=>{
 const results=insertSelectedAnalysis([],original);
 const changed=replaceEmbeddedAnalysis(results,"analysis-1","ai","Commentaire corrigé");
 assert.equal(results[0].content,"Analyse source");
 assert.equal(changed[0].content,"Commentaire corrigé");
 assert.equal(changed[0].archiveId,"archive-1");
 assert.equal(changed[0].origin,"ai");
});
test("same source cannot be inserted twice accidentally",()=>{
 assert.equal(insertSelectedAnalysis([original],original).length,1);
});
