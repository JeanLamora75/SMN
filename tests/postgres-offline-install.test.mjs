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

test("Package and runtime share the short postgres.zip filename without changing the upstream URL", () => {
  const packaging = source("scripts/windows/postgres-archive.mjs");
  const runtime = source("src/server/bootstrap/archive.ts");
  for (const code of [packaging, runtime]) {
    assert.match(code, /PG_ARCHIVE = "postgres\\.zip"/);
    assert.match(code, /PG_SOURCE_ARCHIVE = "postgresql-18\\.6-5-windows-x64-binaries\\.zip"/);
    assert.match(code, /get\\.enterprisedb\\.com\\/postgresql\\/" \\+ PG_SOURCE_ARCHIVE/);
    assert.match(code, /e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2/);
    assert.match(code, /createReadStream\\(file\\)/);
  }
  const portable = source("src/server/bootstrap/portable.ts");
  assert.match(portable, /path\\.join\\(bundledFolder, PG_ARCHIVE\\)/);
  assert.match(portable, /path\\.join\\(bundledFolder, PG_SOURCE_ARCHIVE\\)/);
  assert.match(portable, /copyFile\\(checkedArchive, archive\\)/);
  const distributor = source("scripts/windows/package-portable.mjs");
  assert.match(distributor, /path\\.join\\(pgFolder, PG_ARCHIVE\\)/);
});
