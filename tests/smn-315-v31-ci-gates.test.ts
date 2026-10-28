import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const migration=readFileSync(new URL("../prisma/migrations/20261028_smn316_company_catalog/migration.sql",import.meta.url),"utf8");
const runner=readFileSync(new URL("../scripts/apply-company-schema-migration.ts",import.meta.url),"utf8");
test("v31 : refus avant suppression de team_id",()=>{
 const guard=migration.indexOf("Existing company closures/history");
 const drop=migration.indexOf("DROP COLUMN team_id");
 assert.ok(guard>=0&&drop>guard);
 assert.match(runner,/await db\.query\("BEGIN"\)/);
 assert.match(runner,/await db\.query\("ROLLBACK"\)/);
 assert.match(runner,/schema_version!==30/);
});
test("v31 : entreprise facultative et isolation",()=>{
 assert.match(migration,/FOREIGN KEY \(installation_id,company_id\)/);
 assert.match(migration,/ON DELETE RESTRICT/);
 assert.match(migration,/UPDATE public\.smn_installation SET schema_version=31/);
});
