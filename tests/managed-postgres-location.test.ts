import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { managedStorageRoot } from "../src/server/bootstrap/managed-paths";

describe("PostgreSQL portable — emplacement d'installation", () => {
  it("range une nouvelle installation sous SMN/data/postgres", () => {
    assert.equal(managedStorageRoot(), path.join(process.cwd(), "data", "postgres"));
  });
  it("préserve la reconnaissance des clusters historiques v1", () => {
    const source=readFileSync(path.join(process.cwd(),"src/server/bootstrap/portable.ts"),"utf8");
    assert.match(source,/parsed\.version === 1 \? legacyManagedStorageRoot\(\)/);
    assert.match(source,/parsed\.version === VERSION \? managedStorageRoot\(\)/);
    assert.match(source,/const VERSION = 2;/);
    assert.match(source,/existingManagedUri\(\)/);
  });
  it("sauvegarde et restauration utilisent le manifeste du cluster actif", () => {
    for (const file of ["postgres.ts","restore-sandbox.ts"]) {
      const source=readFileSync(path.join(process.cwd(),"src/server/backup",file),"utf8");
      assert.match(source,/managedPostgresExecutable/);
    }
  });
  it("ignore les données PostgreSQL stockées dans le dépôt SMN", () => {
    const ignore=readFileSync(path.join(process.cwd(),".gitignore"),"utf8");
    assert.match(ignore,/^\/data\/postgres\/$/m);
  });
});
