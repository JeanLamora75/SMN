import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {allowedBriefFields} from "../src/lib/ai-brief-templates";
import {projectScrum} from "../src/lib/report-data-contract";

const source=(path:string)=>readFileSync(path,"utf8");
const cycle={id:"sprint",teamId:"team",name:"Sprint",status:"finished",
 startAt:"2026-11-01",endAt:"2026-11-14",timeZone:"Europe/Paris"};
const provenance={source:"current" as const,snapshotVersion:null,capturedAt:null};

test("v33 brief contract rejects former static story point fields",()=>{
 assert.deepEqual(allowedBriefFields("scrum",[
  "scrum.storyPoints.committed","scrum.storyPoints.completed","scrum.capacity.planned",
  "team.name"
 ]),["scrum.capacity.planned","team.name"]);
 assert.doesNotMatch(source("src/lib/ai-brief-templates.ts"),/\|"scrum\.storyPoints\.(?:committed|completed)"/);
});

test("v33 Scrum report projection does not contain a synthetic legacy metric",()=>{
 const result=projectScrum({cycle,provenance,plannedJh:"25",actualJh:null,objectives:[]});
 assert.equal(Object.prototype.hasOwnProperty.call(result.scrum,"legacyStoryPoints"),false);
 assert.deepEqual(result.scrum.capacity.planned,{value:25,unit:"JH",sourceId:null});
});

test("historical read contract preserves archived values if explicitly provided",()=>{
 const result=projectScrum({cycle:{...cycle,status:"closed"},provenance:{
  source:"closure-snapshot",snapshotVersion:2,capturedAt:"2026-11-17"
 },legacyStoryPoints:{committed:"41",completed:"45.5"},plannedJh:null,actualJh:null,objectives:[]});
 assert.equal(result.scrum.legacyStoryPoints?.committed.value,41);
 assert.equal(result.scrum.legacyStoryPoints?.completed.value,45.5);
});

test("v33 report runtime skips legacy active tables and retains historical snapshots",()=>{
 const reader=source("src/server/reports/report-projection.ts");
 const standard=source("src/server/reports/standard-composition.ts");
 const html=source("src/server/reports/html-preview.ts");
 assert.match(reader,/if\(!v33\)/);
 assert.match(reader,/legacyHistoricalSnapshot=!Array\.isArray\(snap\.indicatorsV33\)&&!!sp/);
 assert.match(reader,/\!v33\|\|legacyHistoricalSnapshot/);
 assert.match(standard,/frozen===null/);
 assert.match(standard,/snapshot\.indicatorsV33/);
 assert.match(html,/v33&&!legacyArchived\?\[\]/);
});

test("no destructive SQL migration is introduced by the contract cutover",()=>{
 const preflight=source("scripts/smn-351-cleanup-preflight.ts");
 assert.match(preflight,/destructive-cutover-not-authorized/);
 assert.match(preflight,/candidate-data-present-requires-reviewed-backup/);
 assert.match(preflight,/sql-dependencies/);
 assert.match(preflight,/backup-restore-proof-not-verified/);
});
