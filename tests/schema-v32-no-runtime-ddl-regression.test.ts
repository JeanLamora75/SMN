import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const migrated=[
 "src/server/reports/templates.ts",
 "src/server/reports/draft-notes.ts",
 "src/server/registries/automatic-highlights.ts"
] as const;

test("A-03: migrated business services do not issue schema DDL",()=>{
 for(const p of migrated){
  const sql=read(p);
  assert.doesNotMatch(sql,/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|INDEX|VIEW|TYPE|SCHEMA)\b/i,p);
 }
});
test("A-03: explicit deferred migration owns the migrated relations",()=>{
 const sql=read("scripts/apply-deferred-schema-v32.ts");
 for(const name of [
  "smn_automatic_highlight_settings","smn_report_template",
  "smn_report_draft","smn_report_draft_audit"
 ])assert.ok(sql.includes("public."+name),name);
 assert.match(sql,/ROLLBACK/);
 assert.match(sql,/schema_version!==32/);
});
