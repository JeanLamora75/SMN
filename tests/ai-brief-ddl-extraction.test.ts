import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const names=["archive","duplicates","human-analyses","responses","templates"];
test("aucun DDL dynamique dans les services Historique IA",()=>{
 for(const name of names){
  const code=readFileSync(new URL("../src/server/ai-briefs/"+name+".ts",import.meta.url),"utf8");
  assert.doesNotMatch(code,/\b(?:CREATE\s+(?:TABLE|INDEX|OR REPLACE FUNCTION|TRIGGER)|ALTER\s+TABLE|DROP\s+TRIGGER)\b/i,name);
 }
});
test("migration explicite avec protection de l'historique",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql",import.meta.url),"utf8");
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS smn_ai_brief_one_active_response/);
 assert.match(sql,/CREATE TRIGGER smn_ai_brief_immutable/);
 assert.doesNotMatch(sql,/\b(?:DROP TABLE|TRUNCATE TABLE|DELETE FROM)\b/i);
});
