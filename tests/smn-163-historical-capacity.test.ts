import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseHistoricalCapacity} from "../src/server/sprints/historical-capacity";
const base={sprintId:"9ecce9f4-e830-40e6-bf42-00d87296144a",source:"Compte rendu",reason:"Saisie rétrospective",revision:0};
describe("SMN-163 — capacité historique qualifiée",()=>{
 it("conserve 24 JH connus et 22,5 JH estimés",()=>{
  assert.equal(parseHistoricalCapacity({...base,quality:"known",qualifiedJh:24})?.qualifiedJh,24);
  assert.equal(parseHistoricalCapacity({...base,quality:"estimated",qualifiedJh:22.5})?.quality,"estimated");
 });
 it("préserve la donnée inconnue sans inventer zéro",()=>{
  assert.equal(parseHistoricalCapacity({...base,quality:"not-supplied",qualifiedJh:null})?.qualifiedJh,null);
  assert.equal(parseHistoricalCapacity({...base,quality:"not-supplied",qualifiedJh:0}),null);
 });
 it("refuse les valeurs numériques non fiables",()=>{
  assert.equal(parseHistoricalCapacity({...base,quality:"estimated",qualifiedJh:NaN}),null);
  assert.equal(parseHistoricalCapacity({...base,quality:"known",qualifiedJh:-1}),null);
 });
});
