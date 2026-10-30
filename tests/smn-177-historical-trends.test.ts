import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectSprintTrend} from "../src/server/sprints/trends";
const mk=(storyPoints:unknown,qualities?:unknown)=>({id:"s1",name:"Sprint historique",end_at:"2026-01-30",version:1,snapshot_data:{storyPoints,historicalMetricQualities:qualities}});
describe("SMN-177 — tendances historiques Scrum",()=>{
 it("conserve les SP terminés connus et leur qualité estimée",()=>{
  const p=projectSprintTrend(mk({done_sp:"13",initial_sp:"20",added_sp:"0",removed_sp:"0"},{SP_DONE:"estimated"}));
  assert.equal(p.completedSp,13);assert.equal(p.completedSpQuality,"estimated");
 });
 it("l'absence n'est pas zéro et la qualité non attestée reste explicite",()=>{
  const p=projectSprintTrend(mk({done_sp:null,initial_sp:null,added_sp:null,removed_sp:null}));
  assert.equal(p.completedSp,null);assert.equal(p.completionRate,null);assert.equal(p.completedSpQuality,"unqualified");
 });
 it("la sélection permet six clôtures historiques pour le filtre",()=>{
  const src=readFileSync("src/server/sprints/trends.ts","utf8");
  assert.match(src,/s.status='closed'/);
  assert.match(src,/s.start_at<=\$2::timestamptz/);
  assert.match(src,/LIMIT 6/);
 });
});
