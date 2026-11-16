import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {renderCycleBriefPrompt,type BriefPromptContext} from "../src/server/ai-briefs/prompt-context";

const ctx:BriefPromptContext={
 id:"a9ce50f0-687e-4696-8d60-c5ffb8c3e3fb",
 teamId:"5eb874ce-7b36-4333-857d-73dc906fbe71",
 name:"Sprint 23",team:"Équipe A",product:"Produit B",
 status:"active",startAt:"2026-11-01",endAt:"2026-11-15",timeZone:"Europe/Paris"
};
const failDb={query:async()=>{throw Error("No arbitrary database query expected")}} as unknown as Client;
test("Scrum scalar rendering uses only authorized cycle context and marks active values provisional",async()=>{
 const result=await renderCycleBriefPrompt(failDb,"scrum",ctx,"{{TEAM_NAME}} / {{SPRINT_NAME}} / {{PRODUCT_NAME}}","fr");
 assert.equal(result.complete,true);
 assert.match(result.text,/Équipe A \[source : team-record ; qualité : provisoire\]/);
 assert.match(result.text,/Sprint 23/);
 assert.match(result.text,/Produit B/);
});
test("Closed Kanban scalar rendering correctly labels current cycle records without inventing Scrum SP",async()=>{
 const result=await renderCycleBriefPrompt(failDb,"kanban",{...ctx,status:"closed"},
  "{{SPRINT_STATUS}} / {{TEAM_NAME}}","en");
 assert.equal(result.complete,true);
 assert.match(result.text,/cycle-record ; quality: recorded/);
 assert.doesNotMatch(result.text,/storyPoints|velocity/i);
});
test("Disallowed or unsupported tags remain unresolved without arbitrary database reads",async()=>{
 const result=await renderCycleBriefPrompt(failDb,"kanban",ctx,
  "{{ROW:MEMBERS_ACTIVE}} / {{CHART:TREND|TYPE=line}} / {{SOMETHING_UNKNOWN}}","fr");
 assert.deepEqual(result.diagnostics.map(x=>x.reason),["restricted","unsupported","unknown"]);
 assert.equal(result.complete,false);
});
test("Rejects unscoped team/cycle before reading data",async()=>{
 await assert.rejects(()=>renderCycleBriefPrompt(failDb,"scrum",{...ctx,teamId:""}, "{{TEAM_NAME}}","fr"),/invalid-brief-cycle-scope/);
});
test("Preparation requires a scoped cycle and makes copying conditional on review of exact rendered text",()=>{
 const page=readFileSync("src/app/app/admin/ai-briefs/prepare/page.tsx","utf8");
 const preview=readFileSync("src/app/app/admin/ai-briefs/prepare/prompt-text-preview.tsx","utf8");
 assert.match(page,/s\.team_id AS "teamId"/);
 assert.match(page,/k\.team_id AS "teamId"/);
 assert.match(page,/canAccess\(account,"write"/);
 assert.match(page,/renderCycleBriefPrompt/);
 assert.match(preview,/approvedText!==result\?\.text/);
 assert.match(preview,/!result\?\.complete/);
});
