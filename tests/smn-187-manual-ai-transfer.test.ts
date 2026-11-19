import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {canApproveBrief} from "../src/lib/ai-brief-review";
const ui=readFileSync("src/app/app/admin/ai-briefs/prepare/brief-overrides.tsx","utf8");
test("AI transfer requires a deliberate manual clipboard action",()=>{
 assert.match(ui,/navigator\.clipboard\.writeText\(preview\)/);
 assert.match(ui,/\{t\("copy"\)\}<\/button>/);
 assert.match(ui,/<BriefAiSendPanel/);
 assert.match(ui,/disabled=\{saving\|\|!approved\}/);
 assert.doesNotMatch(ui,/fetch\(\s*["']https?:\/\//);
 assert.doesNotMatch(ui,/openai\.chat|responses\.create|axios\.post/);
});
test("copy remains disabled until exact version and privacy approval",()=>{
 assert.match(ui,/disabled=\{saving\|\|!approved\}/);
 assert.match(ui,/if\(!approved\|\|!await checkRevision\(\)/);
 const accepted={preview:"exact",currentTxt:"exact",reviewedText:"exact",privacyReviewed:true,revisionChecked:true,conflict:false};
 assert.equal(canApproveBrief(accepted),true);
 assert.equal(canApproveBrief({...accepted,reviewedText:"old"}),false);
});
