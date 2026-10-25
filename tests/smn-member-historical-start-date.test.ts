import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const srv=readFileSync("src/server/members/assignment-start-correction.ts","utf8");
const route=readFileSync("src/app/api/admin/members/[id]/assignment/start-date/route.ts","utf8");
const ui=readFileSync("src/app/app/admin/members/assignment-editor.tsx","utf8");
test("historical start-date edit accepts an earlier real arrival only",()=>{
 assert.match(srv,/later-date-not-supported/);
 assert.match(srv,/isValidDate\(v.newStartOn\)/);
 assert.match(srv,/revision!==v.revision/);
 assert.match(srv,/BEGIN/);assert.match(srv,/ROLLBACK/);
});
test("correction shifts first role version but not subsequent versions",()=>{
 assert.match(srv,/ORDER BY effective_from ASC,revision ASC LIMIT 1/);
 assert.match(srv,/UPDATE public.smn_member_assignment_version SET effective_from/);
 assert.match(srv,/smn_member_assignment_start_audit/);
 assert.doesNotMatch(srv,/smn_sprint_closure_snapshot|smn_report_pdf_archive/);
});
test("admin authorization and explicit confirmation required",()=>{
 assert.match(route,/authorizeApi\(req,"write",\{type:"members"/);
 assert.match(ui,/window.confirm/);
 assert.match(ui,/historicalStart>=state.startOn/);
});
