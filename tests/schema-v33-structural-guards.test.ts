import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {nativeV33BaselineSql} from "../src/server/installation/native-v33";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const probe=read("src/server/db/probe.ts");
const diagnostic=read("src/server/installation/diagnostic.ts");
const baseline=nativeV33BaselineSql();

test("v33: agile mode and archive flags are constrained in baseline and checked by probe",()=>{
 assert.ok(baseline,"Native v33 schema required");
 const team=baseline.match(/CREATE TABLE "public"\."smn_team" \(([\s\S]*?)\n\);/);
 assert.ok(team);
 assert.match(team[1],/"agile_mode" "text" NOT NULL/);
 assert.match(team[1],/"is_archived" boolean DEFAULT false NOT NULL/);
 assert.match(team[1],/smn_team_agile_mode_check/);
 assert.match(probe,/column_name='agile_mode' AND data_type='text' AND is_nullable='NO'/);
 assert.match(probe,/column_name='is_archived' AND data_type='boolean'/);
 assert.match(probe,/column_default IN \('false','false::boolean'\)/);
 assert.match(probe,/conname='smn_team_agile_mode_check' AND contype='c'/);
 assert.match(probe,/convalidated AND pg_get_constraintdef/);
 assert.match(diagnostic,/!snapshot\.teamAgileModeSchemaValid/);
});

test("v33: team and company tenant foreign keys are enforced and probed",()=>{
 assert.ok(baseline);
 for(const key of ["smn_team_product_same_installation_fk",
   "smn_member_company_same_installation_fk","smn_closure_company_fk"])
  assert.ok(baseline.includes(key),"Missing v33 foreign key "+key);
 for(const key of ["smn_member_company_same_installation_fk","smn_closure_company_fk"])
  assert.ok(probe.includes("conname='"+key+"'"),"Probe misses "+key);
 assert.match(probe,/contype='f' AND convalidated/);
 assert.match(probe,/column_name='company_id' AND is_nullable='NO'/);
 assert.match(diagnostic,/!snapshot\.companySchemaValid/);
});

test("v33: schema failures remain explicit even if the database reports the latest version",()=>{
 assert.match(probe,/if\(!teamAgileModeSchemaValid\)/);
 assert.match(probe,/if\(!companySchemaValid\)/);
 assert.match(diagnostic,/!snapshot\.teamAgileModeSchemaValid/);
 assert.match(diagnostic,/!snapshot\.companySchemaValid/);
});
