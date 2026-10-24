import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseHistoricalPartial} from "../src/server/sprints/historical-partial";
const sprintId="9ecce9f4-e830-40e6-bf42-00d87296144a";
describe("SMN-162 — bilan historique partiel",()=>{
 it("accepte un seul objectif sans évaluation",()=>{
  assert.deepEqual(parseHistoricalPartial({sprintId,goalTitle:"Objectif retrouvé"}),{sprintId,goalTitle:"Objectif retrouvé",goalDescription:undefined,reviewComment:undefined,source:undefined});
 });
 it("accepte seulement un commentaire rétrospectif sourcé",()=>{
  const x=parseHistoricalPartial({sprintId,reviewComment:"Notes retrouvées",source:"Compte rendu"});
  assert.equal(x?.reviewComment,"Notes retrouvées");assert.equal(x?.source,"Compte rendu");
 });
 it("refuse toute évaluation fabriquée ou entrée vide",()=>{
  assert.equal(parseHistoricalPartial({sprintId,goalTitle:"But",evaluation:"not_achieved"}),null);
  assert.equal(parseHistoricalPartial({sprintId}),null);
 });
});
