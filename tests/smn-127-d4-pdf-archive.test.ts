import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const route=readFileSync(join(process.cwd(),"src/app/api/admin/reports/sprints/[id]/pdf/route.ts"),"utf8");
test("success response follows archival, never precedes it",()=>{
 const archive=route.indexOf("storeFinalPdfArchive(db,bytes");
 const response=route.indexOf("return new Response(new Uint8Array(result.bytes)");
 assert.ok(archive>=0&&response>archive);
 assert.match(route,/X-SMN-Archive-Id/);
 assert.match(route,/pdf-export-or-archive-failed/);
});
test("metadata binds to verified frozen reference and authorized team",()=>{
 assert.match(route,/readFrozenReportReference/);
 assert.match(route,/renderReferenceSha256:reference.sha256/);
 assert.match(route,/teamId:scope.rows\[0\].teamId/);
 assert.match(route,/authorizeApi\(req,"generate"/);
});
