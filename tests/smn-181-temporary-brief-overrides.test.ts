import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const client=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
const page=readFileSync("src/app/app/admin/ai-briefs/prepare/page.tsx","utf8");
const api=readFileSync("src/app/api/admin/ai-briefs/templates/route.ts","utf8");
test("selected model seeds a temporary prompt",()=>{
 assert.match(page,/template=\{displayed\}/);
 assert.match(client,/useState\(template.promptText\)/);
 assert.match(client,/setPrompt\(/);
 assert.match(client,/setBase\(/);
});
test("brief-only edits do not save the reusable model",()=>{
 assert.match(client,/setObservations\(/);
 assert.match(client,/invalidate\(\)/);
 assert.doesNotMatch(client,/fetch\("\/api\/admin\/ai-briefs\/templates",\{method:"POST"/);
 assert.match(api,/authorizeApi\(req,"write",scope\)/);
});
test("stale revision blocks preview, copy and archiving",()=>{
 assert.match(client,/last.revision!==base.revision/);
 assert.match(client,/setConflict\(true\)/);
 assert.match(client,/revisionChecked/);
 assert.match(client,/if\(!approved\|\|!await checkRevision\(\)/);
});
