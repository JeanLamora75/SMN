import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base=join(process.cwd(),"src/app/app/admin/sprints/[sprintId]/report/preview");
test("print button requires deliberate second action",()=>{
 const src=readFileSync(join(base,"print-report-button.tsx"),"utf8");
 assert.match(src,/setAccepted\(true\)/);
 assert.match(src,/window\.print\(\)/);
 assert.match(src,/d-print-none/);
});
test("printing uses existing Admin-gated HTML page, without server PDF write",()=>{
 const page=readFileSync(join(base,"page.tsx"),"utf8");
 assert.match(page,/canAccess\(account,"write"/);
 assert.match(page,/composeHtmlReportPreview/);
 assert.doesNotMatch(page,/INSERT INTO|writeFileSync|\.pdf"/);
});
test("A4 print pagination retains headers and avoids broken rows",()=>{
 const css=readFileSync(join(base,"print.css"),"utf8");
 assert.match(css,/@page/);
 assert.match(css,/table-header-group/);
 assert.match(css,/break-inside:avoid/);
});
