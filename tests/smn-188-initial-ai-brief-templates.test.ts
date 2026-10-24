import assert from "node:assert/strict";
import {test} from "node:test";
import {initialBriefTemplates,allowedBriefFields,projectCollectiveBriefFacts} from "../src/lib/ai-brief-templates";

test("three initial templates cover review, trends and risks",()=>{
 assert.deepEqual(initialBriefTemplates.map(t=>t.id),["cycle-review","trends","risks-dependencies"]);
 for(const t of initialBriefTemplates){
  assert.ok(t.sections.length&&t.questions.length&&t.instructions.length&&t.data.length);
 }
});
test("Scrum and Kanban expose only mode-specific collective measures",()=>{
 assert.deepEqual(allowedBriefFields("kanban",["kanban.throughput","scrum.storyPoints.completed","member.name","risks"]),["kanban.throughput","risks"]);
 assert.deepEqual(allowedBriefFields("scrum",["scrum.storyPoints.completed","kanban.leadTime","member.email"]),["scrum.storyPoints.completed"]);
});
test("projection does not manufacture missing values or expose private fields",()=>{
 assert.deepEqual(projectCollectiveBriefFacts("scrum",["team.name","scrum.storyPoints.completed","member.name","risks"],{
  "team.name":"Equipe A","member.name":"Alice","risks":null
 }),{"team.name":"Equipe A"});
 assert.deepEqual(projectCollectiveBriefFacts("kanban",["kanban.throughput"],{"kanban.throughput":0}),{"kanban.throughput":0});
});
