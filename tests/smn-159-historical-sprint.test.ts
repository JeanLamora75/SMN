import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseHistoricalSprint} from "../src/server/sprints/historical-create";
describe("SMN-159 — reprise de Sprint historique",()=>{
 const data={name:" Sprint passé ",startAt:"2026-09-07T07:00:00.000Z",endAt:"2026-09-18T15:00:00.000Z",generateCeremonies:false,operationId:"9ecce9f4-e830-40e6-bf42-00d87296144a"};
 it("AC1 valide les bornes réelles et le nom",()=>{
  assert.deepEqual(parseHistoricalSprint(data),{...data,name:"Sprint passé"});
 });
 it("refuse les dates inversées ou identiques",()=>{
  assert.equal(parseHistoricalSprint({...data,endAt:data.startAt}),null);
  assert.equal(parseHistoricalSprint({...data,startAt:data.endAt}),null);
 });
 it("refuse les données étrangères au contrat",()=>{
  assert.equal(parseHistoricalSprint({...data,status:"closed"}),null);
  assert.equal(parseHistoricalSprint({...data,startAt:"invalid"}),null);
 });
});
