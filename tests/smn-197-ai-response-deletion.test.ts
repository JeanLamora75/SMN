import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const ui=readFileSync("src/app/app/ai-briefs/archives/[id]/manual-response-actions.tsx","utf8");
const store=readFileSync("src/server/ai-briefs/responses.ts","utf8")+"\n"+readFileSync("prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql","utf8");
const mutation=readFileSync("src/app/api/ai-briefs/archives/[id]/responses/[responseId]/route.ts","utf8");
test("the deletion confirmation identifies the precise active IA response and its parent",()=>{
 assert.match(ui,/window\.confirm\(/);
 assert.match(ui,/response\.id/);
 assert.match(ui,/archiveId/);
 assert.match(ui,/Le lien actif disparaîtra/);
});
test("cancellation cannot send a deletion request",()=>{
 assert.match(ui,/action==="delete"&&!window\.confirm/);
 assert.match(ui,/\)\)return;/);
});
test("a deletion only deactivates the response, without rewriting TXT or PDF",()=>{
 assert.match(store,/UPDATE public\.smn_ai_brief_response SET deleted_at=now\(\)/);
 assert.match(store,/AND deleted_at IS NULL RETURNING id/);
 assert.doesNotMatch(store,/DELETE FROM public\.smn_ai_brief_archive|UPDATE public\.smn_ai_brief_archive|smn_report_pdf_archive/);
});
test("only admins can delete, new responses remain possible after soft deletion",()=>{
 assert.match(mutation,/authorizeApi\(req,"write"/);
 assert.match(mutation,/export async function DELETE/);
 assert.match(store,/WHERE deleted_at IS NULL/);
 assert.match(store,/smn_ai_brief_one_active_response/);
});
