import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const draft=readFileSync("src/server/ai-briefs/duplicates.ts","utf8");
const archive=readFileSync("src/server/ai-briefs/archive.ts","utf8")+"\n"+readFileSync("prisma/migrations/20261029_ai_brief_runtime_ddl/migration.sql","utf8");
const editor=readFileSync("src/app/app/admin/ai-briefs/duplicates/draft-editor.tsx","utf8");
test("duplication allocates a distinct draft with explicit parent and copies only TXT",()=>{
 assert.match(draft,/const id=randomUUID\(\)/);
 assert.match(draft,/parent_archive_id/);
 assert.match(draft,/parent.text,actorId/);
 assert.doesNotMatch(draft,/INSERT INTO .*analysis/i);
});
test("draft changes require the matching revision and do not mutate parent",()=>{
 assert.match(draft,/revision=\$3 AND finalized_archive_id IS NULL/);
 assert.doesNotMatch(draft,/UPDATE public\.smn_ai_brief_archive/);
});
test("finalization makes a separate immutable archive linked to parent",()=>{
 assert.match(archive,/parent_archive_id uuid/);
 assert.match(archive,/d.content!==x.txt/);
 assert.match(archive,/finalized_archive_id=\$2/);
 assert.match(archive,/BEFORE UPDATE OR DELETE/);
});
test("new copy requires explicit preview and privacy validation",()=>{
 assert.match(editor,/preview===content&&reviewed/);
 assert.match(editor,/approvedSha256/);
 assert.match(editor,/reviewConfirmed:true/);
});
