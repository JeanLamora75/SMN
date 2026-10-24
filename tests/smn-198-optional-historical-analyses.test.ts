import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
const txt=readFileSync("src/lib/ai-brief-txt.ts","utf8");
test("historical analyses are never selected by default",()=>{
 assert.match(ui,/useState<string\[\]>\(\[\]\)/);
 assert.match(ui,/selectedHistory\.includes/);
 assert.match(ui,/historical\.filter/);
});
test("selected AI and human history have explicit origin and time labels",()=>{
 assert.match(txt,/Interprétation IA historique/);
 assert.match(txt,/Observation \/ avis humain historique/);
 assert.match(txt,/safe\(a\.createdAt\)/);
 assert.match(txt,/safe\(a\.origin\)/);
});
test("history selection revokes preview and privacy approval",()=>{
 assert.match(ui,/setSelectedHistory\(old=>/);
 assert.match(ui,/setPreview\(null\);setPrivacyReviewed\(false\);setReviewedText\(null\)/);
 assert.match(ui,/reviewedText===preview&&preview===currentTxt/);
});
