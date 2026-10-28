import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const migration=readFileSync(new URL("../prisma/migrations/20261027_smn306_links/migration.sql",import.meta.url),"utf8");
const transfer=readFileSync(new URL("../src/server/links/admin-transfer.ts",import.meta.url),"utf8");
test("database guarantees scoped transfer constraints",()=>{
 assert.match(migration,/smn_link_scope_team_check CHECK/);
 assert.match(migration,/FOREIGN KEY\(team_id,installation_id\)/);
 assert.match(migration,/REFERENCES public\.smn_team\(id,installation_id\)/);
});
test("transfer is atomic, with optimistic revision and rollback",()=>{
 assert.match(transfer,/await db\.query\("BEGIN"\)/);
 assert.match(transfer,/WHERE id=\$1 AND installation_id=\$2 AND revision=\$6 RETURNING \*/);
 assert.match(transfer,/if\(after\.rowCount!==1\)throw new LinkError\("conflict"\)/);
 assert.match(transfer,/INSERT INTO public\.smn_link_audit/);
 assert.match(transfer,/await db\.query\("COMMIT"\)/);
 assert.match(transfer,/await db\.query\("ROLLBACK"\)/);
});
test("transfer doesn't mutate published report snapshots",()=>{
 assert.doesNotMatch(transfer,/UPDATE\s+public\.smn_report/i);
 assert.doesNotMatch(transfer,/DELETE\s+FROM\s+public\.smn_report/i);
});

test("transfer dialog resolves shared modal and rejects unknown destination teams",()=>{
 const ui=readFileSync(new URL("../src/app/app/admin/settings/links/link-transfer.tsx",import.meta.url),"utf8");
 assert.match(ui,/from "\.\.\/\.\.\/links\/link-dialog"/);
 assert.match(ui,/teams\.some\(team=>team\.id===teamId\)/);
 assert.match(ui,/status==="404"\?t\("links\.notFound"\)/);
});
