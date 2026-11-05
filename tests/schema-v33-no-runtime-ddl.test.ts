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
  assert.doesNotMatch(read(file),/\b(?:CREATE|ALTER|DROP)\s+TABLE\b/i,file);
});

test("v33: deferred historical DDL is not invoked by active services",()=>{
 const active=["src/server/registries/automatic-highlights.ts",
   "src/server/reports/templates.ts","src/server/reports/draft-notes.ts"].map(read);
 for(const source of active){
  assert.doesNotMatch(source,/apply-deferred-schema-v32|applyDeferredSchemaV32/);
 }
});
