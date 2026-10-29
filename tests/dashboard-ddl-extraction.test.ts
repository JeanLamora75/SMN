import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import type {Client} from "pg";
import {assertDashboardTable} from "../src/server/dashboard/schema-ready";
test("aucun DDL dans les services Tableau de bord",()=>{
 for(const name of ["notes","event-edit"]){
  const source=readFileSync(new URL("../src/server/dashboard/"+name+".ts",import.meta.url),"utf8");
  assert.doesNotMatch(source,/\b(?:CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i);
 }
});
test("migration explicite, sans suppression",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261029_dashboard_runtime_ddl/migration.sql",import.meta.url),"utf8");
 assert.equal((sql.match(/CREATE TABLE IF NOT EXISTS/g)||[]).length,4);
 assert.doesNotMatch(sql,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
});
test("contrôle de disponibilité sans DDL",async()=>{
 let query="";
 const db={query:async(sql:string)=>{query=sql;return {rows:[{ready:true}]};}} as unknown as Client;
 await assertDashboardTable(db,"smn_dashboard_note");
 assert.match(query,/to_regclass/);
 assert.doesNotMatch(query,/CREATE TABLE/i);
});
