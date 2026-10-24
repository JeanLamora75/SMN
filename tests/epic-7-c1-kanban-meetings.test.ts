import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseKanbanMeeting} from "../src/server/kanban/meetings";
describe("Epic 7 C1 — réunions réellement enregistrées",()=>{
 it("une réunion Kanban explicite est valide sans sprintId",()=>{
  assert.deepEqual(parseKanbanMeeting({periodId:"period-1",name:"  Atelier flux  ",startAt:"2026-10-24T09:00:00.000Z",duration:45}),
   {periodId:"period-1",name:"Atelier flux",startAt:"2026-10-24T09:00:00.000Z",duration:45});
 });
 it("aucune cérémonie implicite ni réunion sans période",()=>{
  assert.equal(parseKanbanMeeting({name:"Daily",startAt:"2026-10-24T09:00:00.000Z",duration:15}),null);
 });
 it("durées invalides rejetées",()=>{
  for(const duration of [0,481,1.5])assert.equal(parseKanbanMeeting({periodId:"p",name:"Réunion",startAt:"2026-10-24T09:00:00.000Z",duration}),null);
 });
});
