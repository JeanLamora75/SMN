import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("renommage Kanban : transaction limite période et autorisation à une équipe",()=>{
 const source=read("src/server/kanban/rename.ts");
 assert.match(source,/resolveAdminTeam\(db,access\.actor,access\.teamId\)/);
 assert.match(source,/p\.team_id=\$2/);
 assert.match(source,/t\.is_archived=false/);
 assert.match(source,/i\.schema_version<=27/);
 assert.match(source,/FOR UPDATE OF p/);
});
test("renommage Kanban : HTTP v30 sous verrou et avec teamId explicite",()=>{
 const source=read("src/app/api/admin/kanban-periods/[id]/name/route.ts");
 assert.match(source,/resolveRegistryReadContext\(db,/);
 assert.match(source,/!MULTI_TEAM_CONTEXT_READY/);
 assert.match(source,/SMN_MULTI_TEAM_WRITES_ENABLED/);
 assert.match(source,/teamId/);
});
