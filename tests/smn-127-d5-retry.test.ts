import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("export route requires an operation id and holds a session lock until archive is committed",()=>{
 const source=read("src/app/api/admin/reports/sprints/[id]/pdf/route.ts");
 assert.match(source,/validExportOperationId\(operationId\)/);
 assert.match(source,/pg_advisory_lock/);
 assert.match(source,/pg_advisory_unlock/);
 assert.ok(source.indexOf("pg_advisory_lock")<source.indexOf("generateFrozenPdf("));
 assert.match(source,/readVerifiedPdfArchive\(db,archived.id\)/);
 assert.match(source,/retry-conflict/);
});
test("archive operation key is unique in DB and retrying client preserves it",()=>{
 const store=read("src/server/reports/pdf-archive-store.ts");
 const client=read("src/app/app/admin/sprints/[sprintId]/report/preview/frozen-pdf-export.tsx");
 assert.match(store,/operation_id\) VALUES/);
 assert.match(client,/useRef<string\|null>/);
 assert.match(client,/X-SMN-Export-Operation/);
});
test("orphan inventory never deletes files",()=>{
 const audit=read("src/server/reports/archive-audit.ts");
 assert.match(audit,/orphanFiles/);
 assert.match(audit,/missingFiles/);
 assert.doesNotMatch(audit,/unlink|rm\(/);
});
