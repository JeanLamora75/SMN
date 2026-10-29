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

test("A-03: legacy runtime DDL must remain explicitly inventoried until migrated",()=>{
 const paths=[
  "src/server/registries/automatic-highlights.ts",
  "src/server/reports/templates.ts",
  "src/server/reports/draft-notes.ts"
 ];
 for(const path of paths){
  assert.match(source(path),/CREATE TABLE IF NOT EXISTS/,"runtime DDL baseline changed in "+path+"; review migration plan");
 }
});
