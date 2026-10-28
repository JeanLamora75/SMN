import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const source=readFileSync(new URL("../src/server/registries/items.ts",import.meta.url),"utf8");
test("le registre refuse la création sur une équipe archivée",()=>{
 const create=source.slice(source.indexOf("export async function createRegistryItem"),source.indexOf("export async function updateRegistryItem"));
 assert.match(create,/to_jsonb\(t\)->>'is_archived'/);
 assert.match(create,/FOR UPDATE OF t/);
 assert.match(create,/r\.team_id=\$2/);
});
test("le registre refuse la modification sur une équipe archivée",()=>{
 const update=source.slice(source.indexOf("export async function updateRegistryItem"),source.indexOf("export async function readRegistryHistory"));
 assert.match(update,/to_jsonb\(t\)->>'is_archived'/);
 assert.match(update,/old\.team_id!==input\.teamId/);
 assert.match(update,/FOR UPDATE OF r/);
});
