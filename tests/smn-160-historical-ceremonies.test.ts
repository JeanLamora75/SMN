import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseHistoricalSprint} from "../src/server/sprints/historical-create";
const id="9ecce9f4-e830-40e6-bf42-00d87296144a";
const base={name:"Sprint historique",startAt:"2026-09-07T07:00:00.000Z",endAt:"2026-09-18T15:00:00.000Z",operationId:id};
describe("SMN-160 — choix et provenance de reconstruction",()=>{
 it("accepte un choix explicite oui/non",()=>{
  assert.equal(parseHistoricalSprint({...base,generateCeremonies:false})?.generateCeremonies,false);
  assert.equal(parseHistoricalSprint({...base,generateCeremonies:true})?.generateCeremonies,true);
  assert.equal(parseHistoricalSprint(base),null);
 });
 it("refuse un identifiant d'opération invalide",()=>{
  assert.equal(parseHistoricalSprint({...base,generateCeremonies:true,operationId:"abc"}),null);
 });
 it("interdit l'inférence de tenue des événements reconstitués",()=>{
  const file=readFileSync("src/server/sprints/attendance.ts","utf8");
  assert.match(file,/generation_source[^\n]*reconstructed/);
 });
});
