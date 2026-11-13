import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import en from "../src/i18n/en.json";
import fr from "../src/i18n/fr.json";
const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const migration=read("prisma/migrations/20261022_smn91_work_slots/migration.sql");
const repair=read("src/server/sprints/work-slot-schema-repair.ts");
const api=read("src/app/api/admin/sprints/work-slots/repair/route.ts");
const form=read("src/app/app/admin/sprints/work-slots-form.tsx");

test("repair creates exactly the legacy work-hours table without modifying any existing data",()=>{
 assert.match(migration,/CREATE TABLE IF NOT EXISTS public\.smn_team_work_slots/);
 assert.match(repair,/CREATE TABLE public\.smn_team_work_slots/);
 for(const col of ["team_id text PRIMARY KEY","time_zone text NOT NULL","morning_start time NOT NULL",
  "morning_end time NOT NULL","afternoon_start time NOT NULL","afternoon_end time NOT NULL",
  "configured_by text","configured_at timestamptz NOT NULL DEFAULT now()","revision integer NOT NULL DEFAULT 1"]){
  assert.ok(repair.includes(col),col);
  assert.ok(migration.includes(col),col);
 }
 assert.doesNotMatch(repair,/\bDROP\b|\bTRUNCATE\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b/i);
 assert.match(repair,/BEGIN/);assert.match(repair,/COMMIT/);assert.match(repair,/ROLLBACK/);
 assert.match(repair,/pg_advisory_xact_lock/);
 assert.match(repair,/table-incompatible/);
 assert.match(repair,/evaluateSchemaCapability/);
});
test("repair endpoint requires administrator, write permission and deliberate confirmation",()=>{
 assert.match(api,/authorizeApi\(req,"write"/);
 assert.match(api,/actor\.role!=="admin"/);
 assert.match(api,/body\.confirm!=="REPAIR_MISSING_WORK_SLOTS_TABLE"/);
 assert.match(api,/repairMissingWorkSlotsTable/);
 assert.match(api,/export async function POST/);
 assert.doesNotMatch(read("src/app/api/admin/sprints/work-slots/route.ts"),/repairMissingWorkSlotsTable/);
});
test("repair is offered only after a missing table response and user confirmation",()=>{
 assert.match(form,/err\.error==="work-slots-schema-unavailable"\)setMissingSchema\(true\)/);
 assert.match(form,/missingSchema&&<div/);
 assert.match(form,/window\.confirm\(t\("epic4WorkSlots\.repairConfirm"\)\)/);
 assert.match(form,/method:"POST"/);
 assert.match(form,/await load\(teamId\)/);
 for(const key of ["repairButton","repairHelp","repairTitle","repairConfirm","repairIncompatible","repairError"] as const){
  assert.ok(en.epic4WorkSlots[key]);assert.ok(fr.epic4WorkSlots[key]);
 }
});
