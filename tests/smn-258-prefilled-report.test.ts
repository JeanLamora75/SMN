import test from "node:test";
import assert from "node:assert/strict";
import {projectScrum} from "../src/lib/report-data-contract";

const cycle={id:"11111111-1111-4111-8111-111111111111",teamId:"22222222-2222-4222-8222-222222222222",
 name:"Sprint 1",status:"open",startAt:"2026-10-19",endAt:"2026-10-30",timeZone:"Europe/Paris"};
test("missing sprint measures must remain unknown rather than invented zeros",()=>{
 const projection=projectScrum({cycle,provenance:{source:"current",snapshotVersion:null,capturedAt:null},
  committedSp:null,completedSp:null,plannedJh:null,actualJh:null,objectives:[]});
 assert.equal(projection.scrum.storyPoints.committed.value,null);
 assert.equal(projection.scrum.storyPoints.completed.value,null);
 assert.equal(projection.scrum.capacity.planned.value,null);
 assert.equal(projection.scrum.capacity.actual.value,null);
});
test("committed SP remains independent from completed SP",()=>{
 const projection=projectScrum({cycle,provenance:{source:"current",snapshotVersion:null,capturedAt:null},
  committedSp:"21",completedSp:"34",plannedJh:null,actualJh:null,objectives:[]});
 assert.equal(projection.scrum.storyPoints.committed.value,21);
 assert.equal(projection.scrum.storyPoints.completed.value,34);
});
