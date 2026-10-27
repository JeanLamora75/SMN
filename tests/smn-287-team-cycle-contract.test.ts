import {test} from "node:test";
import assert from "node:assert/strict";
import {parseScopedSprintCreate} from "../src/server/sprints/scoped-create";
import {parseScopedKanbanCreate} from "../src/server/kanban/scoped-create";

const common={teamId:"team_a",startOn:"2026-11-02",cadenceRevision:1};

test("contrat formulaire -> services : payload sans nom facultatif",()=>{
 assert.deepEqual(parseScopedSprintCreate(common),common);
 assert.deepEqual(parseScopedKanbanCreate(common),common);
});

test("contrat formulaire -> services : nom facultatif valide",()=>{
 const payload={...common,name:"Cycle équipe A"};
 assert.deepEqual(parseScopedSprintCreate(payload),payload);
 assert.deepEqual(parseScopedKanbanCreate(payload),payload);
});

test("les champs transverses doivent être retirés avant l'appel au service",()=>{
 const payload={...common,mode:"scrum"};
 assert.equal(parseScopedSprintCreate(payload),null);
 assert.equal(parseScopedKanbanCreate(payload),null);
});

test("la révision et le contexte d'équipe sont obligatoires",()=>{
 for(const invalid of [
  {...common,teamId:""},
  {...common,teamId:"../team"},
  {...common,cadenceRevision:0},
  {...common,cadenceRevision:1.5}
 ]){
  assert.equal(parseScopedSprintCreate(invalid),null);
  assert.equal(parseScopedKanbanCreate(invalid),null);
 }
});
