import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseHistoricalActualCapacity} from "../src/server/sprints/historical-actual-capacity";
const base={sprintId:"9ecce9f4-e830-40e6-bf42-00d87296144a",source:"Compte rendu",reason:"Disponibilité reconstituée",revision:0};
describe("SMN-164 — capacité réelle historique",()=>{
 it("conserve un réalisé connu et estimé indépendamment du prévu",()=>{
  assert.equal(parseHistoricalActualCapacity({...base,quality:"known",qualifiedJh:18})?.qualifiedJh,18);
  assert.equal(parseHistoricalActualCapacity({...base,quality:"estimated",qualifiedJh:22.5})?.quality,"estimated");
 });
 it("distingue 0 attesté et valeur absente",()=>{
  assert.equal(parseHistoricalActualCapacity({...base,quality:"known",qualifiedJh:0})?.qualifiedJh,0);
  assert.equal(parseHistoricalActualCapacity({...base,quality:"not-supplied",qualifiedJh:null})?.qualifiedJh,null);
  assert.equal(parseHistoricalActualCapacity({...base,quality:"not-supplied",qualifiedJh:0}),null);
 });
 it("refuse les valeurs incorrectes",()=>{
  assert.equal(parseHistoricalActualCapacity({...base,quality:"estimated",qualifiedJh:-2}),null);
  assert.equal(parseHistoricalActualCapacity({...base,quality:"known",qualifiedJh:NaN}),null);
 });
});
