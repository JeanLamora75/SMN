import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("A-04: v32 is the latest recognized installation version",()=>{
 const diagnostic=source("src/server/installation/diagnostic.ts");
 const schema=source("prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql");
 const runner=source("scripts/apply-team-agile-mode-v32.ts");
 assert.match(diagnostic,/30,31,32\]\.includes\(records\[0\]\.schema_version\)/);
 assert.match(diagnostic,/schema_version>=32/);
 assert.match(schema,/SET schema_version=32/);
 assert.match(runner,/schema_version!==31/);
});

test("A-03: deferred table DDL is explicit and absent from business services",()=>{
 const migration=source("scripts/apply-deferred-schema-v32.ts");
 for(const name of ["smn_automatic_highlight_settings","smn_report_template","smn_report_draft","smn_report_draft_audit"])
  assert.ok(migration.includes("CREATE TABLE IF NOT EXISTS public."+name));
 for(const path of ["src/server/registries/automatic-highlights.ts","src/server/reports/templates.ts","src/server/reports/draft-notes.ts"]){
  assert.doesNotMatch(source(path),/\\b(?:CREATE|ALTER|DROP) TABLE\\b/i,path);
 }
 assert.match(migration,/validateTypes\(table.name,prior.rows,true\)/);
 assert.match(migration,/validateTypes\(table.name,columns.rows\)/);
 assert.match(migration,/ROLLBACK/);
 assert.match(migration,/schema_version!==32/);
});
