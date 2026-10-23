import test from "node:test";
import assert from "node:assert/strict";
import {projectScrum,projectKanban,measuredFromStorage,supportedReportMode} from "../src/lib/report-data-contract";
const cycle={id:"c",teamId:"t",name:"Cycle",startAt:"2026-10-01",endAt:"2026-10-31",timeZone:"Europe/Paris",status:"closed"};
const provenance={source:"closure-snapshot" as const,capturedAt:"2026-10-23T14:00:00Z",snapshotVersion:2};
test("Scrum : conserve SP, JH, objectifs et version V2",()=>{
 const r=projectScrum({cycle,provenance,committedSp:"21",completedSp:"13",plannedJh:"45.5",actualJh:39,objectives:[{id:"g",title:"But",evaluation:"achieved"}]});
 assert.equal(r.mode,"scrum");assert.equal(r.scrum.storyPoints.committed.value,21);
 assert.equal(r.scrum.storyPoints.committed.unit,"SP");assert.equal(r.scrum.capacity.planned.unit,"JH");
 assert.equal(r.scrum.capacity.planned.value,45.5);assert.equal(r.provenance.snapshotVersion,2);
 assert.equal(r.scrum.objectives[0].title,"But");
});
test("Kanban : flux sans fausses cérémonies Scrum",()=>{
 const r=projectKanban({cycle,provenance,flow:[{key:"throughput",measure:{value:8,unit:"items",sourceId:"flow-1"}},{key:"cycleTime",measure:{value:3.4,unit:"days",sourceId:"flow-2"}}]});
 assert.equal(r.mode,"kanban");assert.equal(r.kanban.flow[0].measure.value,8);
 assert.equal("scrum" in r,false);assert.equal(r.kanban.flow[1].measure.unit,"days");
});
test("absence de source = null jamais zéro",()=>{
 assert.equal(measuredFromStorage(null,"SP").value,null);
 assert.equal(measuredFromStorage(undefined,"JH").value,null);
 assert.equal(measuredFromStorage("","SP").value,null);
 assert.equal(measuredFromStorage("0","SP").value,0);
 assert.equal(supportedReportMode("safe"),false);
});
