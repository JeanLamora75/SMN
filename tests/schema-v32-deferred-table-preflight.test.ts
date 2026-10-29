import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=readFileSync(new URL("../scripts/audit-deferred-tables-v32.ts",import.meta.url),"utf8");
test("lot A: deferred-table inventory is strictly read-only and requires schema 32",()=>{
 assert.match(source,/BEGIN READ ONLY/);
 assert.match(source,/schema_version!==32/);
 assert.match(source,/to_regclass\(\$1::text\)/);
 assert.match(source,/information_schema\.columns/);
 assert.match(source,/pg_catalog\.pg_constraint/);
 assert.doesNotMatch(source,/\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+(?:TABLE|INDEX)\b/i);
});
test("lot A: covers settings, templates and report draft audit",()=>{
 for(const name of ["smn_automatic_highlight_settings","smn_report_template","smn_report_draft","smn_report_draft_audit"])assert.ok(source.includes(name));
});
