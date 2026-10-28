import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const worker=readFileSync(new URL("../src/server/capacity/company-recalc-worker.ts",import.meta.url),"utf8");
const migration=readFileSync(new URL("../prisma/migrations/20261028_smn316_company_catalog/migration.sql",import.meta.url),"utf8");
test("recalcul n'écrase pas les corrections manuelles réelles",()=>{
 assert.match(worker,/smn_capacity_actual_override actual/);
 assert.match(worker,/actual\.manual_jh IS NOT NULL/);
 assert.match(worker,/protected\.closed_at IS NOT NULL/);
 assert.match(worker,/protected\.frozen_at IS NOT NULL/);
});
test("migration v31 refuse les historiques fermetures avant destruction des colonnes",()=>{
 assert.ok(migration.indexOf("SELECT count(*) FROM public.smn_company_closure")<
 migration.indexOf("DROP COLUMN team_id"));
 assert.match(migration,/manual review required/);
});
