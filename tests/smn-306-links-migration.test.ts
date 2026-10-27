import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const sql=readFileSync(new URL("../prisma/migrations/20261027_smn306_links/migration.sql",import.meta.url),"utf8");

test("migration keeps the established multi-team schema version",()=>{
 assert.match(sql,/schema_version remains 28/);
 assert.doesNotMatch(sql,/UPDATE\s+public\.smn_installation\s+SET\s+schema_version/iu);
});
test("database rejects cross-installation team and category references",()=>{
 assert.match(sql,/FOREIGN KEY\(team_id,installation_id\)\s+REFERENCES public\.smn_team\(id,installation_id\)/u);
 assert.match(sql,/FOREIGN KEY\(category_id,installation_id\)\s+REFERENCES public\.smn_link_category\(id,installation_id\)/u);
});
test("categories cannot be deleted while referenced by links",()=>{
 assert.match(sql,/REFERENCES public\.smn_link_category\(id,installation_id\) ON DELETE RESTRICT/u);
});
test("audit remains after a link is deleted",()=>{
 assert.match(sql,/CREATE TABLE public\.smn_link_audit/u);
 assert.doesNotMatch(sql,/FOREIGN KEY\s*\(link_id\)/u);
});
test("link scope and team are consistent",()=>{
 assert.match(sql,/scope='TRANSVERSE' AND team_id IS NULL/u);
 assert.match(sql,/scope='EQUIPE' AND team_id IS NOT NULL/u);
});
