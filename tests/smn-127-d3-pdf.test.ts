import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
test("PDF export requires administrator generate rights and verified reference",()=>{
 const route=source("src/app/api/admin/reports/sprints/[id]/pdf/route.ts");
 assert.match(route,/authorizeApi\(req,"generate"/);
 assert.match(route,/readFrozenReportReference/);
 assert.match(route,/reference-unavailable/);
 assert.match(route,/storeFinalPdfArchive/);
 assert.match(route,/validExportOperationId/);
 assert.match(route,/pg_advisory_lock/);
 assert.match(route,/assertTeamReportCycle/);
});
test("server PDF only visits local frozen preview and blocks external requests",()=>{
 const src=source("src/server/reports/frozen-pdf.ts");
 assert.match(src,/127\.0\.0\.1/);
 assert.match(src,/setRequestInterception\(true\)/);
 assert.match(src,/request\.abort\(\)/);
 assert.match(src,/page\.pdf\(/);
 assert.match(src,/validateFinalPdf\(/);
 assert.match(src,/browser\.close\(\)/);
});
test("export is available only for an immutable frozen HTML preview",()=>{
 const page=source("src/app/app/admin/sprints/[sprintId]/report/preview/page.tsx");
 assert.match(page,/frozen&&!teamId\?<FrozenPdfExport/);
 assert.match(page,/if\(teamId&&!await assertTeamReportCycle/);
 assert.match(page,/readFrozenReportReference/);
});
