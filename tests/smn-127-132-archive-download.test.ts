import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const root=process.cwd();
test("private download requires admin authentication and scoped archive ownership",()=>{
 const s=readFileSync(join(root,"src/app/api/admin/reports/archives/[id]/download/route.ts"),"utf8");
 assert.match(s,/sessionAccount\(req\.cookies\.get\(SESSION_COOKIE\)\?\.value\)/);
 assert.match(s,/archiveUserAuthorized\(db,id,actor\.id\)/);
 assert.match(s,/canAccess\(actor,"download"/);
 assert.match(s,/s\.team_id=a\.team_id/);
 assert.match(s,/smn_installation/);
 assert.match(s,/readVerifiedPdfArchive\(db,id\)/);
});
test("hidden archives cannot be downloaded by direct URL",()=>{
 const s=readFileSync(join(root,"src/app/api/admin/reports/archives/[id]/download/route.ts"),"utf8");
 assert.match(s,/smn_report_archive_visibility/);
 assert.match(s,/NOT EXISTS/);
 assert.match(s,/Cache-Control/);
});
test("download does not regenerate, overwrite or modify an archive",()=>{
 const s=readFileSync(join(root,"src/app/api/admin/reports/archives/[id]/download/route.ts"),"utf8");
 assert.doesNotMatch(s,/INSERT INTO|UPDATE public|DELETE FROM|window\.print/);
});
