import test from "node:test";
import assert from "node:assert/strict";
import {convertLegacyPrompt,isValidPromptText} from "../src/lib/ai-brief-prompt";

const legacy={sections:["Contexte","Résultats"],questions:["Quels écarts ?"],instructions:["Ne rien inventer"],data:["team.name","scrum.storyPoints.completed"],depth:3};
test("SMN-472: deterministic lossless conversion",()=>{
 const a=convertLegacyPrompt(legacy);
 assert.equal(a,convertLegacyPrompt(legacy));
 for(const part of [...legacy.sections,...legacy.questions,...legacy.instructions,...legacy.data,String(legacy.depth)])
  assert.ok(a.includes(part),part);
});
test("SMN-472: validates required editable text",()=>{
 assert.equal(isValidPromptText(""),false);
 assert.equal(isValidPromptText("  "),false);
 assert.equal(isValidPromptText("Texte libre"),true);
});
