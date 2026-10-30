import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const source=readFileSync(new URL("../src/server/bootstrap/portable.ts",import.meta.url),"utf8");
test("portable setup creates the dedicated database only after explicit initialization",()=>{
 const helper=source.indexOf("async function createManagedDatabase");
 const setup=source.indexOf("export async function prepareManaged");
 const make=source.lastIndexOf("await createManagedDatabase(uri)");
 assert.ok(helper>=0&&setup>helper&&make>setup);
 assert.match(source,/CREATE DATABASE smn OWNER smn_owner/);
 assert.match(source,/SELECT EXISTS\(SELECT 1 FROM pg_database WHERE datname='smn'\)/);
 assert.match(source,/if\(existing\.rows\[0\]\?\.exists\)throw Error\("database-already-present"\)/);
 const readPath=source.slice(source.indexOf("export async function existingManagedUri"),setup);
 assert.doesNotMatch(readPath,/createManagedDatabase|CREATE DATABASE/);
});
