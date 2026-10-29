import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
test("références et choix Kanban sans DDL métier",()=>{
 for(const n of ["render-reference","report-analysis-choices"]){
  const src=readFileSync(new URL("../src/server/kanban/"+n+".ts",import.meta.url),"utf8");
  assert.doesNotMatch(src,/\bCREATE\s+TABLE|\bALTER\s+TABLE/i,n);
 }
});
test("migration reporting Kanban additive",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261029_kanban_reporting_ddl/migration.sql",import.meta.url),"utf8");
 assert.equal((sql.match(/CREATE TABLE IF NOT EXISTS/g)||[]).length,2);
 assert.doesNotMatch(sql,/\bDROP\s+TABLE|\bTRUNCATE\s+TABLE|\bDELETE\s+FROM/i);
});