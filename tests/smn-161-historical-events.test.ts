import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseHistoricalEvent} from "../src/server/sprints/historical-events";
const value={sprintId:"9ecce9f4-e830-40e6-bf42-00d87296144a",name:"Revue réellement documentée",kind:"review",startAt:"2026-09-18T13:00:00.000Z",duration:60,status:"unknown"};
describe("SMN-161 — événement historique documenté",()=>{
 it("autorise la qualification explicite ou le statut inconnu",()=>{
  assert.equal(parseHistoricalEvent(value)?.status,"unknown");
  assert.equal(parseHistoricalEvent({...value,status:"held"})?.status,"held");
 });
 it("rejette la déduction implicite et les valeurs inconnues",()=>{
  const {status,...withoutStatus}=value;
  assert.equal(parseHistoricalEvent(withoutStatus),null);
  assert.equal(parseHistoricalEvent({...value,status:"scheduled"}),null);
  assert.equal(parseHistoricalEvent({...value,duration:0}),null);
 });
});
