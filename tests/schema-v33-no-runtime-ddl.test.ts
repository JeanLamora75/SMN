import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {nativeV33BaselineSql} from "../src/server/installation/native-v33";

const read=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("v33: report and registry tables are provided by the baseline, not created at runtime",()=>{
 const baseline=nativeV33BaselineSql();
 assert.ok(baseline);
 for(const name of ["smn_automatic_highlight_settings","smn_report_template","smn_report_draft","smn_report_draft_audit"])
  assert.ok(baseline.includes('CREATE TABLE "public"."'+name+'"'),"missing baseline relation "+name);
 for(const file of ["src/server/registries/automatic-highlights.ts",
   "src/server/reports/templates.ts","src/server/reports/draft-notes.ts"])
  assert.doesNotMatch(read(file),/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|INDEX|VIEW|TYPE|SCHEMA)\b/i,file);
});

test("v33: services do not execute the retired deferred migration",()=>{
 const active=["src/server/registries/automatic-highlights.ts",
   "src/server/reports/templates.ts","src/server/reports/draft-notes.ts"].map(read);
 for(const source of active){
  // A diagnostic error message may still mention the manual legacy command.
  // Reject executable migration calls, not explanatory text.
  assert.doesNotMatch(source,/\b(?:await\s+)?applyDeferredSchemaV32\s*\(/);
  assert.doesNotMatch(source,/\b(?:await\s+)?applyDeferredSchema\s*\(/);
  assert.doesNotMatch(source,/\b(?:from\s+|import\s*\()(['"][^'"]*apply-deferred-schema-v32)/);
 }
});
