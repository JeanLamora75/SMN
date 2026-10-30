import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {readSprintTrends} from "../src/server/sprints/trends";
import {trendGeometry} from "../src/lib/sprint-trend-geometry";

const sprintId="123e4567-e89b-42d3-a456-426614174000";
const teamId="team-one";
const sqlFixture=(handler:(sql:string,args?:readonly unknown[])=>{rows:unknown[]})=>{
 const calls:{sql:string;args?:readonly unknown[]}[]=[];
 const db={query:async(sql:string,args?:readonly unknown[])=>{
  calls.push({sql,args});
  assert.match(sql,/^\s*SELECT/i,"G04 must remain SELECT-only");
  return handler(sql,args);
 }} as unknown as Client;
 return {db,calls};
};
const history=(i:number,source:unknown)=>{
 return {id:"sprint-"+i,name:"Sprint "+i,end_at:"2026-10-0"+i+"T18:00:00Z",
  version:2,snapshot_data:source};
};
const snapshot=(done:unknown="8",actual:unknown="10")=>({
 storyPoints:{initial_sp:"10",added_sp:"2",removed_sp:"0",done_sp:done},
 capacity:{actual_jh:actual}
});

describe("SMN-234 D6 — six clôtures pour le filtre, lectures collectives et métriques",()=>{
 it("refuse un Sprint d'une autre équipe avant toute projection",async()=>{
  const f=sqlFixture(()=>({rows:[]}));
  assert.equal(await readSprintTrends(f.db,sprintId,teamId),null);
  assert.equal(f.calls.length,1);
  assert.deepEqual(f.calls[0].args,[sprintId,teamId]);
 });
 it("n'effectue aucun DDL ; si la source de clôture manque, retour []",async()=>{
  const f=sqlFixture(sql=>sql.includes("SELECT s.id,s.team_id")?
   {rows:[{id:sprintId,team_id:teamId,start_at:"2026-10-23T07:00:00Z"}]}:
   {rows:[{present:false}]});
  assert.deepEqual(await readSprintTrends(f.db,sprintId,teamId),[]);
  assert.ok(f.calls.every(({sql})=>!/(?:CREATE|ALTER|UPDATE|INSERT|DELETE)\s+(?:TABLE|public)/i.test(sql)));
 });
 it("ramène au plus six clos, même équipe, non postérieurs, du plus ancien au plus récent",async()=>{
  const rows=[
   history(5,snapshot()),history(4,snapshot()),
   history(3,snapshot()),history(2,snapshot()),history(1,snapshot())
  ];
  const f=sqlFixture((sql,args)=>{
   if(sql.includes("SELECT s.id,s.team_id"))return {rows:[{
    id:sprintId,team_id:teamId,start_at:"2026-10-23T07:00:00Z"}]};
   if(sql.includes("to_regclass"))return {rows:[{present:true}]};
   assert.match(sql,/s\.team_id=\$1/);
   assert.match(sql,/s\.status='closed'/);
   assert.match(sql,/s\.start_at<=\$2::timestamptz/);
   assert.match(sql,/ORDER BY s\.start_at DESC,s\.id DESC LIMIT 5/);
   assert.deepEqual(args,[teamId,"2026-10-23T07:00:00Z"]);
   return {rows};
  });
  const points=await readSprintTrends(f.db,sprintId,teamId);
  assert.equal(points?.length,5);
  assert.deepEqual(points?.map(p=>p.sprintId),
   ["sprint-1","sprint-2","sprint-3","sprint-4","sprint-5"]);
  assert.equal(points?.[0].snapshotVersion,2);
 });
 it("F04 et F07 ne plafonnent pas >100 %, capacité réelle reste distincte de la présence",async()=>{
  const f=sqlFixture(sql=>sql.includes("SELECT s.id,s.team_id")?
   {rows:[{id:sprintId,team_id:teamId,start_at:"2026-10-23T07:00:00Z"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[history(1,snapshot("15","3.5"))]});
  const points=await readSprintTrends(f.db,sprintId,teamId);
  assert.equal(points?.[0].completedSp,15);
  assert.equal(points?.[0].completionRate,125);
  assert.equal(points?.[0].actualCapacityJh,3.5);
 });
 it("conserve zéro authentique, null explicite et sources absentes ou invalides",async()=>{
  const f=sqlFixture(sql=>sql.includes("SELECT s.id,s.team_id")?
   {rows:[{id:sprintId,team_id:teamId,start_at:"2026-10-23T07:00:00Z"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[history(3,{storyPoints:{initial_sp:"0",added_sp:"0",removed_sp:"0",
     done_sp:"0"},capacity:{actual_jh:"0"}}),
    history(2,snapshot(null,null)),
    history(1,{storyPoints:{initial_sp:"n/a",done_sp:"12"},
     capacity:{actual_jh:"bad"}})]});
  const points=await readSprintTrends(f.db,sprintId,teamId);
  assert.equal(points?.[0].completionRate,null);
  assert.equal(points?.[0].actualCapacityJh,null);
  assert.equal(points?.[1].completedSp,null);
  assert.equal(points?.[1].actualCapacityJh,null);
  assert.equal(points?.[2].completedSp,0);
  assert.equal(points?.[2].completionRate,null);
  assert.equal(points?.[2].actualCapacityJh,0);
 });
});

describe("SMN-234 D6 — graphique et accessibilité",()=>{
 it("préserve les lacunes des courbes : aucune ligne ne traverse un point manquant",()=>{
  const chart=trendGeometry([5,null,12,0],640,220);
  assert.equal(chart.dots.length,3);
  assert.equal(chart.segments.length,1); // Only (12,0) adjacent
  assert.ok(chart.segments[0].from.index===2&&chart.segments[0].to.index===3);
 });
 it("gère 0, 1, et 5 valeurs sans division par zéro",()=>{
  assert.deepEqual(trendGeometry([],640,220).dots,[]);
  assert.equal(trendGeometry([0],640,220).dots.length,1);
  assert.equal(trendGeometry([0,0,0,0,0],640,220).segments.length,4);
 });
 it("échelle dynamique visible même pour les taux supérieurs à 100 %",()=>{
  const v=trendGeometry([0,125,200],640,220);
  assert.ok(v.maxY>=200);
  assert.ok(v.dots.every(p=>p.y>=0&&p.y<=220));
 });
 it("raccorde l'onglet à une lecture d'équipe et rend 3 SVG avec tableau textuel",()=>{
  const page=readFileSync(new URL(
   "../src/app/app/admin/sprints/[sprintId]/page.tsx",import.meta.url),"utf8");
  const panel=readFileSync(new URL(
   "../src/app/app/admin/sprints/[sprintId]/sprint-trends-panel.tsx",import.meta.url),"utf8");
  assert.match(page,/active==="trends"\?await readSprintTrends\(db,cycle\.id,teamId\)/);
  assert.match(page,/active==="trends"\?<SprintTrendsPanel/);
  assert.match(panel,/role="img"/);
  assert.match(panel,/<table/);
  assert.match(panel,/completedSp/);
  assert.match(panel,/completionRate/);
  assert.match(panel,/actualCapacityJh/);
  assert.doesNotMatch(panel,/pencil-square/);
 });
});
