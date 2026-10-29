import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const modules=["cadence","periods","meetings","goals","batch-create","closure","flow-counts","qualitative","states","timing"];
test("aucune instruction DDL dans les modules métier Kanban",()=>{
 for(const name of modules){
  const source=readFileSync(new URL("../src/server/kanban/"+name+".ts",import.meta.url),"utf8");
  assert.doesNotMatch(source,/\b(?:CREATE\s+(?:TABLE|INDEX)|ALTER\s+TABLE|DROP\s+TABLE)\b/i,name);
 }
});
test("migration versionnée et non destructive",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261029_kanban_runtime_ddl/migration.sql",import.meta.url),"utf8");
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.smn_kanban_period/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.smn_kanban_closure/);
 assert.doesNotMatch(sql,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
});
test("runner explicite, transactionnel",()=>{
 const src=readFileSync(new URL("../scripts/apply-kanban-schema-v32.ts",import.meta.url),"utf8");
 assert.match(src,/--apply/);assert.match(src,/ROLLBACK/);assert.match(src,/COMMIT/);
});
