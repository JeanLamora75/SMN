import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("prompt migration is additive and never drops historical model columns", () => {
  const sql=readFileSync("prisma/migrations/20261115_smn472_prompt_text/migration.sql","utf8");
  assert.match(sql,/ADD COLUMN IF NOT EXISTS prompt_text text/i);
  assert.doesNotMatch(sql,/DROP\s+(TABLE|COLUMN)/i);
});
test("database backfill requires explicit backup and refuses unresolved fields", () => {
  const body=readFileSync("scripts/apply-smn-472-prompt-models.ts","utf8");
  assert.match(body,/SMN_BRIEF_BACKUP_VERIFIED/);
  assert.match(body,/unresolved\.length/);
  assert.match(body,/ROLLBACK/);
  assert.match(body,/--check/);
  assert.doesNotMatch(body,/DROP COLUMN|DELETE FROM/);
});
