import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {Client} from "pg";
import {scoreMetric,closedSnapshotProjection,readCycleDashboard} from "../src/server/dashboard/cycle-reader";
import {metricAvailable,metricNotRecorded,metricUnavailable,type DashboardMetric} from "../src/lib/dashboard-data-contract";
import {KpiSprintScores} from "../src/app/app/kpi-cards";
import CycleOverview from "../src/app/app/cycle-overview";
import type {SprintContextItem} from "../src/lib/sprint-context";
import {canAccess} from "../src/server/access-policy";

const score=(v:number)=>metricAvailable(v,{source:"manual",quality:"known"});
const empty=metricNotRecorded();
const render=(confidence:DashboardMetric=empty,clarity:DashboardMetric=empty,locale:"fr"|"en"="fr")=>
 renderToStaticMarkup(createElement(KpiSprintScores,{locale,scores:{confidence,clarity}}));
const sprint=(id:string,status="active"):SprintContextItem=>({
 id,name:id,status,suspended:false,timeZone:"Europe/Paris",
 startAt:"2026-10-19T07:00:00Z",endAt:"2026-10-30T18:00:00Z"
});

describe("SMN-21 — AC-UX08 à AC-UX13 : notes I01/I02",()=>{
 it("rejette les notes invalides, distingue null d'une mesure et préserve la provenance",()=>{
  assert.deepEqual(scoreMetric(null,"manual"),metricNotRecorded());
  assert.deepEqual(scoreMetric(undefined,"manual"),metricNotRecorded());
  for(const n of [0,-1,6,1.5,NaN,Infinity,"3"]){
   assert.deepEqual(scoreMetric(n,"manual"),metricUnavailable("read-failed"));
  }
  for(let n=1;n<=5;n++){
   const m=scoreMetric(n,"closure-snapshot",3);
   assert.equal(m.state,"available");
   if(m.state==="available"){
    assert.equal(m.value,n);assert.equal(m.source,"closure-snapshot");
    assert.equal(m.snapshotVersion,3);
   }
  }
 });
 it("convertit indépendamment chaque note 1–5 en 20–100 % et garde deux jauges",()=>{
  for(let note=1;note<=5;note++){
   const html=render(score(note),empty);
   assert.match(html,new RegExp((note*20)+" %"));
   assert.match(html,new RegExp(note+"\\/5"));
   assert.equal((html.match(/class="smn-score-track"/g)||[]).length,2);
   assert.equal((html.match(/class="smn-score-progress"/g)||[]).length,1);
   assert.match(html,new RegExp('stroke-dasharray="'+(note*20)+' 100"'));
   assert.match(html,/I01 · Confiance de l’équipe/);
   assert.match(html,/I02 · Clarté des objectifs/);
   const second=render(empty,score(note));
   assert.match(second,new RegExp((note*20)+" %"));
   assert.equal((second.match(/class="smn-score-progress"/g)||[]).length,1);
  }
 });
 it("la valeur null grise n'affiche jamais de portion active, de faux zéro ni de note",()=>{
  const html=render();
  assert.equal((html.match(/class="smn-score-track"/g)||[]).length,2);
  assert.doesNotMatch(html,/class="smn-score-progress"/);
  assert.equal((html.match(/Non renseigné/g)||[]).length,4);
  assert.doesNotMatch(html,/0 %|0\/5|20 %/);
  assert.equal((html.match(/(?:tabindex|tabIndex)="0"/g)||[]).length,2);
  assert.match(html,/aria-label="Confiance de l’équipe : Non renseigné"/);
 });
 it("une seule note présente ne colore que sa propre jauge ; invalides neutres",()=>{
  const html=render(empty,score(4));
  assert.equal((html.match(/class="smn-score-progress"/g)||[]).length,1);
  assert.match(html,/80 %/);
  assert.doesNotMatch(html,/(?:^|[^0-9])0 %|0\/5/);
  for(const n of [0,6,2.5]){
   const invalid=render(score(n),empty);
   assert.doesNotMatch(invalid,/class="smn-score-progress"/);
   assert.match(invalid,/Non renseigné/);
  }
 });
 it("préserve l'anglais et les équivalents textuels des jauges",()=>{
  const html=render(score(2),empty,"en");
  assert.match(html,/Team confidence/);
  assert.match(html,/Goal clarity/);
  assert.match(html,/aria-label="Team confidence: 40% \(2\/5\)"/);
  assert.match(html,/Not specified/);
  assert.doesNotMatch(html,/Confiance de l’équipe|Non renseigné/);
 });
 it("préserve les quatre KPI précédents et ajoute la cinquième carte en dernier",()=>{
  const html=renderToStaticMarkup(createElement(CycleOverview,{
   context:{productId:"p",product:"Produit",teamId:"team",team:"Équipe",mode:"scrum"},
   teamHref:"/app/team/team",locale:"fr",cycle:sprint("sprint-a")
  }));
  assert.equal((html.match(/class="smn-metric-card /g)||[]).length,5);
  assert.ok(html.indexOf("Jours ouvrés restants")<html.indexOf("I01 · Confiance"));
  assert.ok(html.indexOf("I01 · Confiance")<html.indexOf("I02 · Clarté"));
  assert.doesNotMatch(html,/Avancement global|0 %|0\/5/);
 });
 it("lit les scores du Sprint réellement sélectionné sous contrôle d'équipe, sans écriture",async()=>{
  const seen:{sql:string;args:readonly unknown[]}[]=[];
  const values:Record<string,{confidence:number|null;clarity:number|null}>={
   "sprint-a":{confidence:1,clarity:null},
   "sprint-b":{confidence:null,clarity:5}
  };
  const db={query:async(sql:string,args:readonly unknown[]=[])=>{
   seen.push({sql,args});
   if(/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(sql))
    throw Error("dashboard-must-remain-read-only");
   if(sql.includes("SELECT s.status"))
    return {rows:args[1]==="team"?[{status:"active"}]:[]};
   if(sql.includes("to_regclass"))
    return {rows:[{present:args[0]==="public.smn_sprint_scores"}]};
   if(sql.includes("SELECT confidence,clarity FROM public.smn_sprint_scores"))
    return {rows:[values[String(args[0])]]};
   if(sql.includes("SELECT now() AS at"))
    return {rows:[{at:"2026-10-24T12:00:00Z"}]};
   if(sql.includes("SELECT now() AS now_at"))
    return {rows:[{now_at:"2026-10-24T12:00:00Z"}]};
   if(/^\s*(SAVEPOINT|RELEASE SAVEPOINT|ROLLBACK TO SAVEPOINT)/.test(sql))
    return {rows:[]};
   throw Error("Unhandled: "+sql);
  }} as unknown as Client;
  const a=await readCycleDashboard(db,"team",sprint("sprint-a"));
  const b=await readCycleDashboard(db,"team",sprint("sprint-b"));
  assert.equal(a.scores.confidence.state,"available");
  assert.equal(a.scores.clarity.state,"not-recorded");
  assert.equal(b.scores.confidence.state,"not-recorded");
  assert.equal(b.scores.clarity.state,"available");
  if(a.scores.confidence.state==="available")assert.equal(a.scores.confidence.value,1);
  if(b.scores.clarity.state==="available")assert.equal(b.scores.clarity.value,5);
  const queries=seen.filter(x=>x.sql.includes("SELECT confidence,clarity FROM public.smn_sprint_scores"));
  assert.deepEqual(queries.map(x=>x.args),[["sprint-a"],["sprint-b"]]);
  await assert.rejects(()=>readCycleDashboard(db,"autre-equipe",sprint("sprint-a")),
   /dashboard-cycle-out-of-scope/);
 });
 it("les clôtures lisent exclusivement leur snapshot Vn, et les anciens snapshots restent neutres",()=>{
  const updated=closedSnapshotProjection({
   goals:[],storyPoints:null,ticketCounts:null,
   confidenceClarity:{confidence:3,clarity:null}
  },4);
  assert.equal(updated.scores.confidence.state,"available");
  if(updated.scores.confidence.state==="available"){
   assert.equal(updated.scores.confidence.value,3);
   assert.equal(updated.scores.confidence.source,"closure-snapshot");
   assert.equal(updated.scores.confidence.snapshotVersion,4);
  }
  assert.equal(updated.scores.clarity.state,"not-recorded");
  const legacy=closedSnapshotProjection({goals:[],storyPoints:null},1);
  assert.deepEqual(legacy.scores.confidence,metricUnavailable("history-missing"));
  assert.deepEqual(legacy.scores.clarity,metricUnavailable("history-missing"));
  assert.doesNotMatch(render(legacy.scores.confidence,legacy.scores.clarity),/smn-score-progress/);
 });
 it("la lecture d'une clôture prend les notes Vn sans relire les notes modifiées depuis",async()=>{
  const queries:string[]=[];
  const db={query:async(sql:string,args:readonly unknown[]=[])=>{
   queries.push(sql);
   if(sql.includes("SELECT s.status"))return {rows:[{status:"closed"}]};
   if(sql.includes("to_regclass"))return {rows:[{
    present:args[0]==="public.smn_sprint_closure_snapshot"
   }]};
   if(sql.includes("SELECT version,snapshot"))return {rows:[{version:3,snapshot:{
    goals:[],storyPoints:null,ticketCounts:null,
    confidenceClarity:{confidence:5,clarity:2}
   }}]};
   if(sql.includes("SELECT now() AS at"))return {rows:[{at:"2026-10-24T12:00:00Z"}]};
   throw Error("Unexpected current read on closed Sprint: "+sql);
  }} as unknown as Client;
  const projection=await readCycleDashboard(db,"team",sprint("historique","closed"));
  assert.equal(projection.snapshotVersion,3);
  assert.equal(projection.scores.confidence.state,"available");
  assert.equal(projection.scores.clarity.state,"available");
  if(projection.scores.confidence.state==="available")
   assert.equal(projection.scores.confidence.value,5);
  if(projection.scores.clarity.state==="available")
   assert.equal(projection.scores.clarity.value,2);
  assert.ok(!queries.some(sql=>sql.includes("FROM public.smn_sprint_scores")));
 });
 it("respecte les droits de lecture admin/user, les thèmes et les replis responsive",()=>{
  const resource={type:"collective",exists:true,inScope:true} as const;
  for(const role of ["admin","user"] as const)
   assert.equal(canAccess({role,is_active:true,must_change_password:false},"read",resource),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "write",resource),false);
  const css=readFileSync(new URL("../src/app/dashboard.css",import.meta.url),"utf8");
  assert.match(css,/\.smn-metric-grid\s*\{\s*display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  for(const width of [1180,1000,520])assert.match(css,new RegExp("@container \\(max-width:"+width+"px\\)"));
  assert.match(css,/\.smn-score-section \+ \.smn-score-section \{border-top:1px solid var\(--smn-border\)/);
  assert.match(css,/\.smn-score-track \{stroke:var\(--smn-muted\)/);
  assert.match(css,/\.smn-score-progress \{stroke:var\(--smn-primary\)/);
 });
});
