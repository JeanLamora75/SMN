import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {classifySnapshot,type Snapshot} from "../src/server/installation/diagnostic";
import {COUNTRY_CONSOLIDATION_MIGRATION,COUNTRY_CONSOLIDATION_MIGRATION_SQL} from "../src/server/countries/consolidation-migration";
import {INSTALLATION_RELATIONS} from "../src/server/installation/contract";

const migrationPath=new URL("../prisma/migrations/20261028_smn270_281_country_consolidation/migration.sql",import.meta.url);
describe("Pays — vérification de la migration v30",()=>{
 it("conserve une seule source SQL équivalente à la migration versionnée",()=>{
  assert.equal(COUNTRY_CONSOLIDATION_MIGRATION_SQL,readFileSync(migrationPath,"utf8"));
  assert.equal(COUNTRY_CONSOLIDATION_MIGRATION,"20261028_smn270_281_country_consolidation");
 });
 it("reconnaît les tables Pays sans effacer le module Liens",()=>{
  for(const name of ["smn_country_name_audit","smn_country_lifecycle_audit",
   "smn_national_holiday_manual_audit","smn_national_calendar_validation_audit",
   "smn_link_category","smn_link","smn_link_audit"])
   assert.ok(INSTALLATION_RELATIONS.includes(("public."+name+":r") as typeof INSTALLATION_RELATIONS[number]),name);
 });
 it("refuse une version 30 dont le nombre de migrations est incohérent",()=>{
  const snapshot:Snapshot={schemaUsage:true,schemaCreate:true,serverVersion:180006,
   tables:["public._prisma_migrations:r","public.smn_installation:r"],
   tableRead:true,migrationsRead:true,shapeValid:true,
   installations:[{id:"singleton",state:"initialized",schema_version:30}],
   migrations:[]};
  assert.equal(classifySnapshot(snapshot).status,"installation-incomplete");
 });
 it("le SQL v30 reste additif avec son marqueur de version",()=>{
  assert.match(COUNTRY_CONSOLIDATION_MIGRATION_SQL,/ADD COLUMN IF NOT EXISTS revision/);
  assert.match(COUNTRY_CONSOLIDATION_MIGRATION_SQL,/CREATE TABLE IF NOT EXISTS public\.smn_country_name_audit/);
  assert.match(COUNTRY_CONSOLIDATION_MIGRATION_SQL,/schema_version=30/);
  assert.match(COUNTRY_CONSOLIDATION_MIGRATION_SQL,/schema_version=29/);
  assert.equal(createHash("sha256").update(COUNTRY_CONSOLIDATION_MIGRATION_SQL).digest("hex").length,64);
 });
});
