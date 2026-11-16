import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
test("historical analyses are never included by default",()=>{
 assert.match(ui,/useState<string\[\]>\(\[\]\)/);
 assert.match(ui,/selectedHistory\.includes/);
 assert.match(ui,/historical\.filter/);
});
test("explicit selection includes type, origin, timestamp and cycle",()=>{
 assert.match(ui,/x.type\+"\|"\+x.createdAt\+"\|"\+x.origin/);
 assert.match(ui,/x.cycleId/);
 assert.match(ui,/sanitize\(x.content\)/);
 assert.match(ui,/t\("historyIncluded"\)/);
});
test("history edits invalidate preview and all privacy approval",()=>{
 assert.match(ui,/setSelectedHistory\(old=>/);
 assert.match(ui,/invalidate\(\);/);
 assert.match(ui,/setPreview\(null\)/);
 assert.match(ui,/setReviewedText\(null\)/);
 assert.match(ui,/canApproveBrief/);
});
