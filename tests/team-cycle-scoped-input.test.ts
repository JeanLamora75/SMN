import assert from "node:assert/strict";
import {test} from "node:test";
import {parseScopedSprintCreate} from "../src/server/sprints/scoped-create";
import {parseScopedKanbanCreate} from "../src/server/kanban/scoped-create";

const valid={teamId:"team_01",startOn:"2026-11-02",cadenceRevision:2};
for(const [mode,parse] of [
 ["Scrum",parseScopedSprintCreate],["Kanban",parseScopedKanbanCreate]
] as const){
 test(mode+" : accepte un cycle correctement contextualisé",()=>{
  assert.deepEqual(parse(valid),valid);
 });
 test(mode+" : refuse les IDs invalides et champs supplémentaires",()=>{
  for(const input of [
   {...valid,teamId:"../autre-equipe"}, {...valid,teamId:""},
   {...valid,unexpected:"other"}, {...valid,cadenceRevision:0},
   {...valid,cadenceRevision:1.2}
  ])assert.equal(parse(input),null);
 });
 test(mode+" : refuse les dates incorrectes",()=>{
  for(const startOn of ["2026-02-29","2026-11-31","2026-11-2",""])
   assert.equal(parse({...valid,startOn}),null);
 });
}
