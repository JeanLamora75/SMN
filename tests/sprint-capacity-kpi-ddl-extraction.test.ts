import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
test("aucun DDL métier dans les KPI de capacité Sprint",()=>{
 const source=readFileSync(new URL("../src/server/sprints/sprint-capacity-kpis.ts",import.meta.url),"utf8");
 assert.doesNotMatch(source,/\bCREATE\s+TABLE|\bALTER\s+TABLE/i);
});
test("migration KPI explicite et additive",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261029_sprint_capacity_kpi_runtime_ddl/migration.sql",import.meta.url),"utf8");
 assert.equal((sql.match(/CREATE TABLE IF NOT EXISTS/g)||[]).length,2);
 assert.doesNotMatch(sql,/\bDROP\s+TABLE|\bTRUNCATE\s+TABLE|\bDELETE\s+FROM/i);
});
