import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
test("privacy approval is bound to the exact previewed TXT",()=>{
 assert.match(ui,/reviewedText===preview&&preview===currentTxt/);
 assert.match(ui,/disabled=\{preview===null\|\|preview!==currentTxt\|\|conflict\}/);
 assert.match(ui,/setReviewedText\(e.target.checked\?preview:null\)/);
});
test("editing free text or template revokes the previous approval",()=>{
 for(const setter of ["setObservations","setHumanQuestions","setHumanInstructions","setDraft"]){
  assert.ok(ui.includes(setter));
 }
 assert.match(ui,/setPrivacyReviewed\(false\)/);
 assert.match(ui,/setReviewedText\(null\)/);
});
test("the complete preview and its confidentiality warning are visible",()=>{
 assert.match(ui,/readOnly value=\{preview\}/);
 assert.match(ui,/noms, informations privées ou secrets/);
 assert.match(ui,/aucun export ni finalisation possible/);
});
