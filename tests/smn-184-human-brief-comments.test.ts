import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
test("human observations remain explicitly separate from reported facts",()=>{
 assert.match(ui,/setObservations/);
 assert.match(ui,/observationsText/);
 assert.match(ui,/t\("notesIncluded"\)/);
 assert.match(ui,/resolved.text,observationsText,historyText/);
 assert.doesNotMatch(ui,/\bautoGenerateObservations\b/);
});
test("empty human notes cannot generate fictional analysis",()=>{
 assert.match(ui,/observations\.trim\(\)\?/);
 assert.match(ui,/\:""/);
 assert.doesNotMatch(ui,/hypothèse automatique|conclusion automatique/i);
});
test("privacy approval is invalidated on every human text edit",()=>{
 assert.match(ui,/onChange=\{e=>\{setObservations\(e.target.value\);invalidate\(\);\}\}/);
 assert.match(ui,/setPrivacyReviewed\(false\)/);
 assert.match(ui,/setReviewedText\(null\)/);
});
