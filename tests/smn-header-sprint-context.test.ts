import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {defaultSprintId,effectiveSprintStatus,selectedSprint,type SprintContextItem} from "../src/lib/sprint-context";
import {readSprintContext} from "../src/server/sprints/context";

const at=Date.parse("2026-10-23T12:00:00Z");
const sprint=(id:string,start:string,end:string,extra:Partial<SprintContextItem>={}):SprintContextItem=>({
 id,name:id,status:"planned",suspended:false,timeZone:"Europe/Paris",
 startAt:start,endAt:end,...extra
});
const past=sprint("past","2026-10-01T08:00:00Z","2026-10-12T18:00:00Z",{status:"finished"});
const active=sprint("active","2026-10-19T08:00:00Z","2026-11-01T22:59:00Z",{status:"planned"});
const next=sprint("next","2026-11-02T08:00:00Z","2026-11-15T22:59:00Z");
const later=sprint("later","2026-11-16T08:00:00Z","2026-11-29T22:59:00Z");
const all=[later,next,past,active];

describe("SMN — sélecteur Sprint contextuel",()=>{
 it("priorise le Sprint réellement en cours même si le statut stocké est en retard",()=>{
  assert.equal(defaultSprintId(all,at),"active");
  assert.equal(effectiveSprintStatus(active,at),"active");
  assert.equal(selectedSprint(all,null,at)?.id,"active");
 });
 it("respecte une sélection manuelle de l'équipe, y compris un Sprint futur ou passé",()=>{
  assert.equal(selectedSprint(all,"later",at)?.id,"later");
  assert.equal(selectedSprint(all,"past",at)?.id,"past");
  assert.equal(selectedSprint(all,"unknown",at)?.id,"active");
  assert.equal(selectedSprint([],null,at),null);
 });
 it("choisit le plus proche futur, sinon le plus récent passé",()=>{
  assert.equal(defaultSprintId([later,next,past],at),"next");
  assert.equal(defaultSprintId([past],at),"past");
 });
 it("ignore les Sprints suspendus et clôturés pour le choix automatique actif",()=>{
  assert.equal(defaultSprintId([{...active,suspended:true},next],at),"next");
  assert.equal(defaultSprintId([{...active,status:"closed"},next],at),"next");
  assert.equal(defaultSprintId([{...past,status:"closed"}],at),"past");
  assert.equal(effectiveSprintStatus({...active,status:"closed"},at),"closed");
 });
 it("respecte strictement la borne exclusive de fin",()=>{
  assert.equal(effectiveSprintStatus(active,Date.parse(active.endAt)),"finished");
 });
 it("ne limite pas implicitement la liste des Sprints et n'écrit pas dans PostgreSQL",async()=>{
  const rows=Array.from({length:123},(_,i)=>({
   id:"sprint-"+i,name:"Sprint "+i,status:"planned",suspended:false,
   start_at:new Date(Date.parse("2026-11-02T08:00:00Z")+i*1209600000),
   end_at:new Date(Date.parse("2026-11-13T17:00:00Z")+i*1209600000),
   time_zone:"Europe/Paris"
  }));
  const calls:string[]=[];
  const fake={
   query:async(sql:string,params?:unknown[])=>{
    calls.push(sql);
    assert.doesNotMatch(sql,/\b(?:CREATE|ALTER|INSERT|UPDATE|DELETE|LIMIT)\b/i);
    if(sql.includes("to_regclass"))return {rows:[{table_exists:true,suspension_exists:true}]};
    assert.deepEqual(params,["team"]);
    assert.match(sql,/s\.team_id=\$1/);
    assert.match(sql,/s\.deleted_at IS NULL/);
    assert.match(sql,/i\.id='singleton'/);
    return {rows};
   }
  } as unknown as Client;
  const r=await readSprintContext(fake,"team",at);
  assert.equal(r.items.length,123);
  assert.equal(r.items[0]?.id,"sprint-0");
  assert.equal(r.defaultCycleId,"sprint-0");
  assert.equal(calls.length,2);
 });
 it("ne suppose pas qu'une nouvelle installation contient déjà smn_sprint",async()=>{
  const fake={query:async()=>({rows:[{table_exists:false,suspension_exists:false}]})} as unknown as Client;
  assert.deepEqual(await readSprintContext(fake,"team",at),{items:[],defaultCycleId:null});
 });
 it("connecte le header, l'API protégée et le tableau de bord à la même source",()=>{
  const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const shell=read("src/app/app/private-shell.tsx");
  const dashboard=read("src/app/app/page.tsx");
  const route=read("src/app/api/sprints/context/route.ts");
  const cycle=read("src/app/app/cycle-overview.tsx");
  assert.match(shell,/mode==="kanban"\?"\/api\/kanban\/context":"\/api\/sprints\/context"/);
  assert.match(shell,/sprints\.map\(item=><option/);
  assert.match(shell,/router\.push\("\/app\?"/);
  assert.match(route,/authorizeApi\(request,"read"/);
  assert.match(route,/withSprintIndexDb/);
  assert.match(dashboard,/selectedSprint\(sprintData\.items/);
  assert.match(dashboard,/<CycleOverview context=\{context\} locale=\{locale\} teamHref=\{teamHref\} cycle=\{cycle\} projection=\{projection\}/);
  assert.match(cycle,/effectiveSprintStatus\(cycle\)/);
 });
});
