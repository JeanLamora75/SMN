import assert from "node:assert/strict";
import {test} from "node:test";
import {PROMPT_TEXT_LIMIT,validatePromptModelDraft} from "../src/lib/ai-brief-prompt-model";
import {initialBriefTemplates} from "../src/lib/ai-brief-templates";

const valid={title:"Analyse du sprint",description:"",promptText:"Analyse {{SPRINT_NAME}} et résume les risques {{ROW:RISKS}}."};
test("accepts a text-only model with embedded report tags",()=>{
  assert.equal(validatePromptModelDraft(valid),true);
  assert.equal(validatePromptModelDraft({...valid,description:"Résumé factuel"}),true);
});
test("rejects missing title, blank prompt and excessive payloads",()=>{
  assert.equal(validatePromptModelDraft({...valid,title:" "}),false);
  assert.equal(validatePromptModelDraft({...valid,promptText:"   "}),false);
  assert.equal(validatePromptModelDraft({...valid,promptText:"x".repeat(PROMPT_TEXT_LIMIT+1)}),false);
  assert.equal(validatePromptModelDraft({...valid,promptText:"secret\u0000"}),false);
});

test("three protected native templates have usable Office-style prompt source",()=>{
  assert.equal(initialBriefTemplates.length,3);
  for(const item of initialBriefTemplates){
    assert.equal(validatePromptModelDraft({title:item.title,description:item.description,promptText:item.promptText}),true);
    assert.match(item.promptText,/{{(?:TEAM_NAME|SPRINT_NAME)}}/);
    assert.ok(!item.promptText.includes("undefined"));
  }
});
