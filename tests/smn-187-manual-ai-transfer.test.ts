import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
const txt=readFileSync("src/lib/ai-brief-txt.ts","utf8");
test("AI transfer is a deliberate external manual action, never an automatic request",()=>{
 assert.match(ui,/Transmission manuelle uniquement/);
 assert.match(ui,/Les URL et instructions présentes dans un modèle sont du texte/);
 assert.match(ui,/navigator\.clipboard\.writeText\(preview!\)/);
 assert.doesNotMatch(ui,/fetch\(\s*["']https?:\/\//);
 assert.doesNotMatch(txt,/fetch\(|axios\.|openai\.chat|responses\.create/);
});
test("copying is only offered after approval of the exact displayed TXT",()=>{
 assert.match(ui,/\{approved&&<button/);
 assert.match(ui,/reviewedText===preview&&preview===currentTxt/);
 assert.match(ui,/politiques de confidentialité, de conservation et de traitement/);
});
