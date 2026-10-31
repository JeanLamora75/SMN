import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseKanbanTrendPayload} from "../src/lib/kanban-trend-payload";

import {selectKanbanTrends,type TrendPeriod} from "../src/server/kanban/trends";
const items:TrendPeriod[]=Array.from({length:8},(_,i)=>({id:"p"+i,name:"P"+i,startOn:`2026-${String(i+1).padStart(2,"0")}-01`,endOn:`2026-${String(i+1).padStart(2,"0")}-28`,status:"closed",started:i===3?null:i,throughput:i+1,wipFinal:0}));
describe("SMN-153 — tendances de flux Kanban",()=>{
 it("AC1/AC2 — retient au plus cinq périodes quel que soit le statut en ordre chronologique",()=>{
  const result=selectKanbanTrends(items,{startOn:"2026-08-01",id:"p7"});
  assert.equal(result.length,5);
  assert.deepEqual(result.map(p=>p.id),["p3","p4","p5","p6","p7"]);
 });
 it("AC3 — exclut les périodes postérieures",()=>{
  assert.deepEqual(selectKanbanTrends(items,{startOn:"2026-04-01",id:"p3"}).map(p=>p.id),["p0","p1","p2","p3"]);
 });
 it("AC4 — préserve null et zéro sans interpolation",()=>{
  const result=selectKanbanTrends(items,{startOn:"2026-08-01",id:"p7"});
  assert.equal(result[0].started,null);
  assert.equal(result[0].wipFinal,0);
 });
 it("AC5 — les périodes actives sont conservées sans inventer leurs métriques",()=>{
  const active=items.map(x=>({...x,status:"active",started:null}));
  const result=selectKanbanTrends(active,{startOn:"2026-08-01",id:"p7"});
  assert.equal(result.length,5);
  assert.ok(result.every(p=>p.started===null));
 });
});

const repoFile=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const payload={periods:items.slice(3,8).map(({id,name,startOn,endOn,started,throughput,wipFinal})=>({
 id,name,startOn,endOn,started,throughput,wipFinal,cycleDays:null,leadDays:null
}))};
describe("SMN-153 — transport sûr et rendu des graphiques",()=>{
 it("AC1/AC4 — trois séries distinctes préservent null et zéro",()=>{
  const rows=parseKanbanTrendPayload(payload);
  assert.ok(rows);
  assert.equal(rows[0].started,null);
  assert.equal(rows[0].wipFinal,0);
  assert.deepEqual(rows.map(p=>p.throughput),[4,5,6,7,8]);
  const view=repoFile("src/app/app/admin/kanban-periods/[id]/report/trends-panel.tsx");
  assert.match(view,/const series=\["started","throughput","wipFinal"\]/);
  assert.match(view,/p\[key\]!==null&&/);
  assert.doesNotMatch(view,/Math\.max\(0,\s*p\[key\]/);
 });
 it("AC2/AC3 — la requête borne côté serveur à l'équipe, sans filtrer les statuts",()=>{
  const query=repoFile("src/server/kanban/trends.ts");
  assert.match(query,/WHERE p\.team_id=\$1 AND p\.deleted_at IS NULL/);
  assert.doesNotMatch(query,/p\.status='closed'/);
  assert.match(query,/p\.start_on<\$2::date/);
  assert.match(query,/ORDER BY p\.start_on DESC,p\.id DESC LIMIT 6/);
 });
 it("AC4 — données absentes non interprétées comme zéro et payload non fiable refusé",()=>{
  assert.equal(parseKanbanTrendPayload({periods:[]})?.length,0);
  assert.equal(parseKanbanTrendPayload({periods:[{...payload.periods[0],started:undefined}]}),null);
  assert.equal(parseKanbanTrendPayload({periods:[{...payload.periods[0],started:-1}]}),null);
  assert.equal(parseKanbanTrendPayload({periods:[{...payload.periods[0],wipFinal:1.5}]}),null);
  assert.equal(parseKanbanTrendPayload({periods:[...payload.periods,payload.periods[0]]}),null);
 });
 it("AC5 — état vide et aucune mutation ou contrôle Enregistrer dans le graphique",()=>{
  const view=repoFile("src/app/app/admin/kanban-periods/[id]/report/trends-panel.tsx");
  assert.match(view,/if\(!periods\.length\)return/);
  assert.doesNotMatch(view,/method:"(POST|PUT|PATCH|DELETE)"/);
  assert.doesNotMatch(view,/type="submit"/);
 });
 it("AC1/AC5 — catalogues de traduction alignés en français et anglais",()=>{
  const fr=JSON.parse(repoFile("src/i18n/fr.json")).kanbanTrends;
  const en=JSON.parse(repoFile("src/i18n/en.json")).kanbanTrends;
  assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
  for(const key of ["started","throughput","wipFinal","noPeriods","unavailable"])
   assert.ok(fr[key]&&en[key],key);
 });
});
