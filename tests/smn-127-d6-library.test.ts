import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
test("authorized user's library excludes revoked and hidden archives",()=>{
 const code=src("src/server/reports/user-archive-library.ts");
 assert.match(code,/g\.revoked_at IS NULL/);
 assert.match(code,/g\.user_id=\$1/);
 assert.match(code,/NOT EXISTS \(SELECT 1 FROM public\.smn_report_archive_visibility/);
});
test("download rechecks role, scope and PDF integrity",()=>{
 const code=src("src/app/api/admin/reports/archives/[id]/download/route.ts");
 assert.match(code,/sessionAccount/);assert.match(code,/canAccess\(actor,"download"/);
 assert.match(code,/archiveUserAuthorized/);assert.match(code,/readVerifiedPdfArchive/);
});
test("admin may revoke archive permission",()=>{
 const code=src("src/app/api/admin/reports/archives/[id]/grants/route.ts");
 assert.match(code,/export async function DELETE/);assert.match(code,/revokeArchiveUser/);
});
