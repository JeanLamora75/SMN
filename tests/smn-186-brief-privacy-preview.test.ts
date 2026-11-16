import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {canApproveBrief} from "../src/lib/ai-brief-review";
const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
const state={preview:"TXT exact",currentTxt:"TXT exact",reviewedText:"TXT exact",privacyReviewed:true,revisionChecked:true,conflict:false};
test("approval attaches to exact preview, revision and privacy review",()=>{
 assert.equal(canApproveBrief(state),true);
 for(const update of [{currentTxt:"TXT changed"},{preview:null},{reviewedText:null},{privacyReviewed:false},{revisionChecked:false},{conflict:true}])
  assert.equal(canApproveBrief({...state,...update}),false);
});
test("text edits and history changes revoke approval",()=>{
 for(const setter of ["setObservations","setPrompt","setSelectedHistory"])assert.ok(ui.includes(setter),setter);
 assert.match(ui,/function invalidate\(\)/);
 assert.match(ui,/setPreview\(null\)/);
 assert.match(ui,/setPrivacyReviewed\(false\)/);
 assert.match(ui,/setReviewedText\(null\)/);
});
test("preview is read-only, complete and requires privacy confirmation",()=>{
 assert.match(ui,/readOnly value=\{preview\?\?""\}/);
 assert.match(ui,/t\("privacyConfirm"\)/);
 assert.match(ui,/disabled=\{saving\|\|!approved\}/);
 assert.match(ui,/txtBytes>0&&txtBytes<=200000/);
});
