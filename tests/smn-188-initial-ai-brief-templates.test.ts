import assert from "node:assert/strict";
import {test} from "node:test";
import {initialBriefTemplates,allowedBriefFields} from "../src/lib/ai-brief-templates";

test("three initial templates cover review, trends and risks",()=>{
 assert.deepEqual(initialBriefTemplates.map(t=>t.id),["cycle-review","trends","risks-dependencies"]);
 for(const t of initialBriefTemplates){
  assert.ok(t.promptText.trim().length>20);
  assert.match(t.promptText,/\{\{SPRINT_NAME\}\}/);
  assert.doesNotMatch(t.promptText,/member\.name|member\.email/i);
 }
});
test("Scrum and Kanban expose only mode-specific collective measures",()=>{
 assert.deepEqual(allowedBriefFields("kanban",["kanban.throughput","scrum.storyPoints.completed","member.name","risks"]),["kanban.throughput","risks"]);
 assert.deepEqual(allowedBriefFields("scrum",["scrum.storyPoints.completed","kanban.leadTime","member.email"]),["scrum.storyPoints.completed"]);
});
test("le catalogue de données collectives exclut les champs individuels",()=>{
 assert.deepEqual(allowedBriefFields("scrum",["team.name","member.name","member.email","scrum.storyPoints.completed"]),["team.name","scrum.storyPoints.completed"]);
 assert.deepEqual(allowedBriefFields("kanban",["kanban.throughput","member.email"]),["kanban.throughput"]);
});
