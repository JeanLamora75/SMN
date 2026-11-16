import test from "node:test";
import assert from "node:assert/strict";
import {canApproveBrief,type BriefReviewState} from "../src/lib/ai-brief-review";

const valid:BriefReviewState={
 preview:"Sprint A\nProvisoire\n",currentTxt:"Sprint A\nProvisoire\n",
 reviewedText:"Sprint A\nProvisoire\n",privacyReviewed:true,revisionChecked:true,conflict:false
};
test("SMN-476: exact approved preview permits copy and archive",()=>{
 assert.equal(canApproveBrief(valid),true);
});
test("SMN-476: changed prompt or context invalidates review",()=>{
 assert.equal(canApproveBrief({...valid,currentTxt:"Sprint B\n"}),false);
 assert.equal(canApproveBrief({...valid,currentTxt:"Sprint A\nClôturé\n"}),false);
 assert.equal(canApproveBrief({...valid,reviewedText:"prior version"}),false);
});
test("SMN-476: review, revision check and conflict prevent transfer",()=>{
 assert.equal(canApproveBrief({...valid,privacyReviewed:false}),false);
 assert.equal(canApproveBrief({...valid,revisionChecked:false}),false);
 assert.equal(canApproveBrief({...valid,conflict:true}),false);
 assert.equal(canApproveBrief({...valid,preview:null}),false);
});
