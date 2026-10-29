import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const probe=read("src/server/db/probe.ts");
const diagnostic=read("src/server/installation/diagnostic.ts");
const v32=read("prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql");
const v31=read("prisma/migrations/20261028_smn316_company_catalog/migration.sql");

test("A-01: the v32 probe checks type, NOT NULL, default and validated agile mode constraint",()=>{
 assert.match(probe,/column_name='agile_mode' AND data_type='text' AND is_nullable='NO'/);
 assert.match(probe,/column_name='is_archived' AND data_type='boolean'/);
 assert.match(probe,/column_default IN \('false','false::boolean'\)/);
 assert.match(probe,/conname='smn_team_agile_mode_check' AND contype='c'/);
 assert.match(probe,/convalidated AND pg_get_constraintdef/);
 assert.match(v32,/CHECK \(agile_mode IN \('scrum','kanban'\)\)/);
 assert.match(diagnostic,/!snapshot\.teamAgileModeSchemaValid/);
});

test("A-02: the v31 probe checks validated foreign keys and nonnullable closure owner",()=>{
 for(const name of ["smn_member_company_same_installation_fk","smn_closure_company_fk"]){
  assert.ok(probe.includes("conname='"+name+"'"));
  assert.ok(v31.includes(name));
 }
 assert.match(probe,/contype='f' AND convalidated/);
 assert.match(probe,/column_name='company_id' AND is_nullable='NO'/);
 assert.match(diagnostic,/!snapshot\.companySchemaValid/);
});

test("A-01/A-02: migration files remain versioned and immutable",()=>{
 assert.match(v31,/schema_version=31/);
 assert.match(v32,/schema_version=32/);
 assert.match(probe,/if\(!teamAgileModeSchemaValid\)/);
 assert.match(probe,/if\(!companySchemaValid\)/);
});
