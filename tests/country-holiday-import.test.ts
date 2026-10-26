import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {detectLocalImportFormat,isExpectedImportPreview,summarizeImportPreview}
 from "../src/lib/countries/holiday-import";
const row=(date:string,action:"create"|"replace"|"reject")=>({
 line:2,date,name:"Holiday",country:"FR",action,reason:action==="reject"?"existing-date":null,
 previousName:action==="replace"?"Old":null});
describe("SMN-277 unified import",()=>{
 it("accepts CSV or ICS extensions only",()=>{
  assert.equal(detectLocalImportFormat("fr.csv"),"csv");
  assert.equal(detectLocalImportFormat("FR.ICS"),"ics");
  assert.equal(detectLocalImportFormat("file.txt"),null);
 });
 it("summarizes multiple years including unknown dates",()=>{
  assert.deepEqual(summarizeImportPreview([
   row("1999-05-01","create"),row("2042-05-01","replace"),
   row("2042-08-15","reject"),row("invalid","reject")
  ]),[
   {year:1999,created:1,replaced:0,proposed:1,rejected:0},
   {year:2042,created:0,replaced:1,proposed:1,rejected:1},
   {year:null,created:0,replaced:0,proposed:0,rejected:1}
  ]);
 });
 it("rejects an out-of-scope or mismatched preview",()=>{
  const p={rows:[row("2026-05-01","create")],proposed:1,rejected:0,
   fingerprint:"a".repeat(64),country:"FR",policy:"skip"};
  assert.equal(isExpectedImportPreview(p,"FR","skip"),true);
  assert.equal(isExpectedImportPreview(p,"DE","skip"),false);
  assert.equal(isExpectedImportPreview(p,"FR","replace"),false);
  assert.equal(isExpectedImportPreview({...p,fingerprint:"bad"},"FR","skip"),false);
 });
});
