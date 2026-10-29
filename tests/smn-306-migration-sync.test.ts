import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {LINKS_MIGRATION,LINKS_MIGRATION_SQL} from "../src/server/links/migration";

test("bundled SQL is exactly the versioned migration file",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261027_smn306_links/migration.sql",import.meta.url),"utf8");
 assert.equal(LINKS_MIGRATION,"20261027_smn306_links");
 assert.equal(LINKS_MIGRATION_SQL.replace(/\r\n/g,"\n"),sql.replace(/\r\n/g,"\n"));
});
test("runtime diagnostic no longer reads SQL from file system",()=>{
 const file=readFileSync(new URL("../src/server/installation/diagnostic.ts",import.meta.url),"utf8");
 assert.doesNotMatch(file,/readFileSync\([^\n]*links|readFileSync\([^\n]*smn306_links/i);
 assert.match(file,/LINKS_MIGRATION_SQL/);
});
