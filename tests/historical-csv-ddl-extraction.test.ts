import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import type {Client} from "pg";
import {assertHistoricalCsvTable} from "../src/server/historical-csv/schema-ready";
test("imports CSV métier sans DDL",()=>{
 for(const file of ["attempts","confirm"]){
  const source=readFileSync(new URL("../src/server/historical-csv/"+file+".ts",import.meta.url),"utf8");
  assert.doesNotMatch(source,/\b(?:CREATE\s+(?:TABLE|INDEX)|ALTER\s+TABLE|DROP\s+TABLE)\b/i);
 }
});
test("migration explicite et non destructive",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261029_historical_csv_runtime_ddl/migration.sql",import.meta.url),"utf8");
 assert.equal((sql.match(/CREATE TABLE IF NOT EXISTS/g)||[]).length,3);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS source_line/);
 assert.match(sql,/ADD COLUMN IF NOT EXISTS previous_quality/);
 assert.doesNotMatch(sql,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
});
test("garde SQL en lecture seule",async()=>{
 let count=0;
 const db={query:async(sql:string)=>{count++;assert.match(sql,/to_regclass/);return {rows:[{ready:true}]};}} as unknown as Client;
 await assertHistoricalCsvTable(db,"smn_historical_csv_attempt");
 assert.equal(count,1);
});
