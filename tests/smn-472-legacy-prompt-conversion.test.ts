import assert from "node:assert/strict";
import {test} from "node:test";
import {prepareLegacyBriefPrompt} from "../src/lib/ai-brief-legacy-conversion";

test("converts known scalar fields and preserves prose and order", () => {
  const result=prepareLegacyBriefPrompt({
    title:"Bilan",sections:["Contexte","Résultats"],questions:["Quels écarts ?"],
    instructions:["Ne pas extrapoler."],data:["cycle.name","team.name","cycle.dates"],depth:3,
  });
  assert.deepEqual(result.unresolvedFields,[]);
  assert.match(result.promptText,/{{SPRINT_NAME}}/);
  assert.match(result.promptText,/{{TEAM_NAME}}/);
  assert.match(result.promptText,/{{SPRINT_START}}[\s\S]*{{SPRINT_END}}/);
  assert.ok(result.promptText.indexOf("# Contexte")<result.promptText.indexOf("# Résultats"));
  assert.match(result.promptText,/Quels écarts \?/);
  assert.match(result.promptText,/Ne pas extrapoler\./);
  assert.equal(result.historicalDepth,3);
});
test("reports unmapped fields rather than silently dropping them", () => {
  const result=prepareLegacyBriefPrompt({
    title:"Risques",sections:["Risques"],questions:[],instructions:[],
    data:["risks","dependencies","risks","scrum.storyPoints.completed"],depth:2,
  });
  assert.deepEqual(result.unresolvedFields,["risks","dependencies","scrum.storyPoints.completed"]);
  assert.doesNotMatch(result.promptText,/{{ROW:RISKS}}/);
});
