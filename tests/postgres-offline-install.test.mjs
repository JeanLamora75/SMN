import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("Offline PostgreSQL ZIP integrity is checked without loading 384 MB into memory", () => {
  const archive = source("src/server/bootstrap/archive.ts");
  assert.match(archive, /createReadStream\(file\)/);
  assert.match(archive, /for await \(const chunk of createReadStream\(file\)\)/);
  assert.doesNotMatch(archive, /readFile\(file\)/);
  assert.match(archive, /PG_SHA256/);
});

test("Offline setup supports tar and Windows PowerShell fallback", () => {
  const portable = source("src/server/bootstrap/portable.ts");
  assert.match(portable, /run\("tar\.exe"/);
  assert.match(portable, /run\("powershell\.exe"/);
  assert.match(portable, /-NoProfile/);
  assert.match(portable, /-NonInteractive/);
  assert.match(portable, /Expand-Archive -LiteralPath/);
  assert.match(portable, /postgres-extract-failed/);
  assert.match(portable, /pgsql-partial-/);
  assert.match(portable, /managedStorageRoot\(\)/);
});

test("Offline extract failures have a safe user-visible diagnostic in both languages", () => {
  const job = source("src/server/bootstrap/job.ts");
  assert.match(job, /"postgres-extract-failed"/);
  for (const locale of ["fr", "en"]) {
    const catalog = JSON.parse(source("src/i18n/" + locale + ".json"));
    assert.ok(catalog && JSON.stringify(catalog).includes("postgres-extract-failed"));
  }
});
