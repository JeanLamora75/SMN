import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const code=readFileSync("src/server/ai-briefs/responses.ts","utf8")+"\n"+readFileSync("prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql","utf8");
const api=readFileSync("src/app/api/ai-briefs/archives/[id]/responses/route.ts","utf8");
const mutation=readFileSync("src/app/api/ai-briefs/archives/[id]/responses/[responseId]/route.ts","utf8");
const page=readFileSync("src/app/app/ai-briefs/archives/[id]/page.tsx","utf8");
test("database enforces one active answer even during concurrent requests",()=>{
 assert.match(code,/CREATE UNIQUE INDEX IF NOT EXISTS smn_ai_brief_one_active_response/);
 assert.match(code,/ON public\.smn_ai_brief_response\(archive_id\) WHERE deleted_at IS NULL/);
 assert.match(code,/code==="23505"/);
 assert.match(api,/already-active/);
});
test("editing keeps existing response ID while updating timestamp",()=>{
 assert.match(code,/UPDATE public\.smn_ai_brief_response SET response_text/);
 assert.match(code,/updated_at=now\(\)/);
 assert.match(mutation,/authorizeApi\(req,"write"/);
});
test("explicit soft deletion preserves immutable TXT and permits replacement",()=>{
 assert.match(code,/SET deleted_at=now\(\)/);
 assert.match(code,/AND r.deleted_at IS NULL/);
 assert.doesNotMatch(code,/UPDATE public\.smn_ai_brief_archive/);
 assert.match(page,/responses.length===0/);
});
