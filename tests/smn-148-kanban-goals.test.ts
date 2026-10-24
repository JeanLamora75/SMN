import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {goalEvaluations,parseKanbanGoal} from "../src/server/kanban/goals";
describe("SMN-148 — objectifs Kanban indépendants",()=>{
 it("AC1/AC2 — accepte un nouvel objectif uniquement non évalué",()=>{
  const value=parseKanbanGoal({title:" Améliorer le flux ",description:"Limiter le WIP",evaluation:"not_evaluated",comment:null});
  assert.equal(value?.title,"Améliorer le flux");
  assert.equal(value?.evaluation,"not_evaluated");
  assert.equal(parseKanbanGoal({title:"Objectif",description:"",evaluation:"not_achieved"}),null);
 });
 it("AC3 — accepte quatre états, sans confondre non évalué et non atteint",()=>{
  assert.deepEqual(goalEvaluations,["not_evaluated","achieved","partially_achieved","not_achieved"]);
  const base={id:"aabbccdd-1234-4321-8888-000000000001",revision:2,title:"Objectif",description:"",comment:"Explication"};
  for(const evaluation of goalEvaluations)assert.equal(parseKanbanGoal({...base,evaluation})?.evaluation,evaluation);
 });
 it("AC3/AC4 — contrôle description et commentaire isolés",()=>{
  assert.equal(parseKanbanGoal({title:"   ",description:"",evaluation:"not_evaluated"}),null);
  assert.equal(parseKanbanGoal({title:"Objectif",description:"",evaluation:"not_evaluated",comment:"x".repeat(2001)}),null);
  assert.equal(parseKanbanGoal({title:"Objectif",description:"x".repeat(4001),evaluation:"not_evaluated"}),null);
 });
});
