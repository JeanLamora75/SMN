import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {Client} from "pg";
import {canAccess} from "../src/server/access-policy";
import {readCycleDashboard} from "../src/server/dashboard/cycle-reader";
import {collectionUnavailable,metricAvailable,metricNotRecorded,type CollectiveCycleProjection} from "../src/lib/dashboard-data-contract";
import {sprintWorkingDaysRemaining} from "../src/lib/sprint-working-days";
import {translate} from "../src/i18n/catalog";
import CycleOverview from "../src/app/app/cycle-overview";
import OperationalOverview from "../src/app/app/operational-overview";
import type {SprintContextItem} from "../src/lib/sprint-context";
import type {DashboardContext} from "../src/server/dashboard/read";

const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const teamId="team-authorisee";
const context:DashboardContext={
 productId:"produit-1",product:"Produit pilote",teamId,team:"Équipe pilote",mode:"scrum"
};
const sprint=(id:string,status="active"):SprintContextItem=>({
 id,name:"Sprint "+id,status,suspended:false,timeZone:"Europe/Paris",
 startAt:"2026-11-09T08:00:00Z",endAt:"2026-11-22T22:59:59Z"
});
type RecordRow=Record<string,unknown>;
function mock(handler:(sql:string,args:readonly unknown[])=>readonly RecordRow[]){
 const history:{sql:string;args:readonly unknown[]}[]=[];
 const db={query:async(sql:string,args:readonly unknown[]=[])=>{
  history.push({sql,args});
  if(/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)\b/i.test(sql))
   throw Error("dashboard-must-be-read-only");
  return {rows:handler(sql,args)};
 }} as unknown as Client;
 return {db,history};
}
const snap=(initial:string,done:string)=>({
 goals:[{id:"goal-v2",title:"Objectif historique",evaluation:"achieved"}],
 storyPoints:{initial_sp:initial,done_sp:done},
 ticketCounts:{initial_tickets:"3",done_tickets:"0"},
 capacity:{initial_jh:"12",actual_jh:"8"},
 ceremonies:[],customMeetings:[],exceptionalMeetings:[]
});

describe("Étape 5 — recette transversale du cockpit Scrum (SMN-21)",()=>{
 it("refuse les consultations et écritures aux mauvais rôles avant toute lecture",()=>{
  const collective={type:"collective",exists:true,inScope:true} as const;
  const admin={role:"admin",is_active:true,must_change_password:false};
  const user={role:"user",is_active:true,must_change_password:false};
  assert.equal(canAccess(admin,"read",collective),true);
  assert.equal(canAccess(user,"read",collective),true);
  assert.equal(canAccess(user,"write",collective),false);
  assert.equal(canAccess(user,"read",{...collective,inScope:false}),false);
  assert.equal(canAccess({...admin,must_change_password:true},"read",collective),false);
  assert.equal(canAccess({...admin,is_active:false},"read",collective),false);
  const ticketApi=file("src/app/api/admin/sprints/tickets/route.ts");
  assert.match(ticketApi,/authorizeApi\(req,"write",resource\)/);
  assert.match(ticketApi,/authorizeApi\(req,"read",resource\)/);
 });
 it("deux Sprints affichent exclusivement leurs chiffres ; zéro et null sont différents",async()=>{
  const fixture:Record<string,{goals:RecordRow[];sp:RecordRow[];tickets:RecordRow[]}> = {
   sprintA:{goals:[{id:"ga",title:"Objectif A",evaluation:"achieved"}],
    sp:[{initial_sp:"8",done_sp:"0"}],tickets:[{initial_tickets:"5",done_tickets:null}]},
   sprintB:{goals:[{id:"gb",title:"Objectif B",evaluation:"not_evaluated"}],
    sp:[{initial_sp:null,done_sp:"3"}],tickets:[{initial_tickets:null,done_tickets:"2"}]}
  };
  let selected="sprintA";
  const fake=mock((sql,args)=>{
   if(sql.includes("SELECT s.status")){
    assert.deepEqual(args,[selected,teamId]);
    return [{status:"active"}];
   }
   if(sql.includes("to_regclass"))return [{
    present:["smn_sprint_goal","smn_sprint_story_points","smn_sprint_ticket_counts"]
      .some(name=>args[0]==="public."+name)
   }];
   if(sql.includes("FROM public.smn_sprint_goal")){assert.deepEqual(args,[selected]);return fixture[selected].goals;}
   if(sql.includes("FROM public.smn_sprint_story_points")){assert.deepEqual(args,[selected]);return fixture[selected].sp;}
   if(sql.includes("FROM public.smn_sprint_ticket_counts")){assert.deepEqual(args,[selected]);return fixture[selected].tickets;}
   if(sql.includes("SELECT now() AS"))return [{now_at:"2026-11-13T12:00:00Z",at:"2026-11-13T12:00:00Z"}];
   if(sql.includes("information_schema.tables"))return [];
   if(sql.startsWith("SAVEPOINT")||sql.startsWith("RELEASE SAVEPOINT"))return [];
   throw Error("unexpected dashboard SQL: "+sql);
  });
  const a=await readCycleDashboard(fake.db,teamId,sprint("sprintA"));
  selected="sprintB";
  const b=await readCycleDashboard(fake.db,teamId,sprint("sprintB"));
  assert.equal(a.cycleId,"sprintA");
  assert.equal(b.cycleId,"sprintB");
  assert.equal(a.goals.state,"available");
  assert.equal(b.goals.state,"available");
  if(a.goals.state==="available"&&b.goals.state==="available"){
   assert.deepEqual(a.goals.items.map(g=>g.title),["Objectif A"]);
   assert.deepEqual(b.goals.items.map(g=>g.title),["Objectif B"]);
  }
  assert.equal(a.storyPoints.done.state,"available");
  if(a.storyPoints.done.state==="available")assert.equal(a.storyPoints.done.value,0);
  assert.equal(b.storyPoints.initial.state,"not-recorded");
  assert.equal(a.tickets.done.state,"not-recorded");
  assert.equal(b.tickets.done.state,"available");
  if(b.tickets.done.state==="available")assert.equal(b.tickets.done.value,2);
  assert.equal(a.events.state,"unavailable");
  assert.ok(fake.history.every(x=>!/\b(?:CREATE|ALTER|INSERT|UPDATE|DELETE)\b/i.test(x.sql)));
  const scopedReads=fake.history.filter(x=>/FROM public.smn_sprint_(?:story_points|ticket_counts|goal)/.test(x.sql));
  assert.equal(scopedReads.length,6);
  assert.deepEqual(scopedReads.map(q=>q.args[0]),[
   "sprintA","sprintA","sprintA","sprintB","sprintB","sprintB"
  ]);
 });
 it("une usurpation de Sprint hors équipe échoue avant toute donnée métier",async()=>{
  const fake=mock(sql=>{
   if(sql.includes("SELECT s.status"))return [];
   throw Error("lecture non autorisée : "+sql);
  });
  await assert.rejects(()=>readCycleDashboard(fake.db,teamId,sprint("autre-equipe")),
   /dashboard-cycle-out-of-scope/);
  assert.equal(fake.history.length,1);
 });
 it("une clôture V2 prime sur les tables courantes, et un statut clôturé termine le compteur",async()=>{
  const fake=mock((sql,args)=>{
   if(sql.includes("SELECT s.status"))return [{status:"closed"}];
   if(sql.includes("to_regclass"))return [{present:args[0]==="public.smn_sprint_closure_snapshot"}];
   if(sql.includes("SELECT version,snapshot"))return [{version:2,snapshot:snap("12","7")}];
   if(sql.includes("SELECT now() AS at"))return [{at:"2026-11-12T12:00:00Z"}];
   throw Error("lecture courante interdite pour une clôture : "+sql);
  });
  const result=await readCycleDashboard(fake.db,teamId,sprint("sprint-historique","closed"));
  assert.equal(result.snapshotVersion,2);
  assert.equal(result.storyPoints.done.state,"available");
  if(result.storyPoints.done.state==="available"){
   assert.equal(result.storyPoints.done.value,7);
   assert.equal(result.storyPoints.done.source,"closure-snapshot");
  }
  assert.equal(result.tickets.done.state,"available");
  if(result.tickets.done.state==="available")assert.equal(result.tickets.done.value,0);
  assert.equal(result.workingDaysRemaining.state,"available");
  if(result.workingDaysRemaining.state==="available")assert.equal(result.workingDaysRemaining.value,0);
  assert.ok(!fake.history.some(x=>/FROM public.smn_sprint_(?:story_points|ticket_counts|goal)/.test(x.sql)));
 });
 it("jours ouvrés : bornes, weekend, fuseau, futur/terminé et règle provisoire",()=>{
  const item=sprint("sprintA");
  assert.equal(sprintWorkingDaysRemaining(item,new Date("2026-11-09T08:00:00Z"),"include-today").days,10);
  assert.equal(sprintWorkingDaysRemaining(item,new Date("2026-11-09T08:00:00Z"),"exclude-today").days,9);
  assert.equal(sprintWorkingDaysRemaining(item,new Date("2026-11-21T10:00:00Z"),"include-today").days,0);
  assert.equal(sprintWorkingDaysRemaining(item,new Date("2026-11-23T10:00:00Z"),"include-today").days,0);
 });
 it("une source événement indisponible n'annonce jamais le chiffre zéro aux lecteurs d'écran",()=>{
  const unavailable=collectionUnavailable("schema-missing");
  const none=metricNotRecorded();
  const projection:CollectiveCycleProjection={
   teamId,cycleId:"sprintA",cycleStatus:"active",snapshotVersion:null,
   goals:unavailable,capacity:{initialJh:none,actualJh:none},
   storyPoints:{initial:metricAvailable(0,{source:"manual",quality:"known"}),done:none},
   tickets:{initial:none,done:none},
   scores:{confidence:none,clarity:none},
   workingDaysRemaining:metricAvailable(5,{source:"calculated",quality:"known"}),
   events:unavailable,obstacles:unavailable,risks:unavailable,notesAndAlerts:unavailable
  };
  const panel=renderToStaticMarkup(createElement(OperationalOverview,{
   locale:"fr",projection,timeZone:"Europe/Paris"
  }));
  assert.match(panel,/Nombre d(?:&#x27;|')éléments indisponible/);
  assert.doesNotMatch(panel,/aria-label="0 événements"/);
  assert.match(panel,/id="registres"/);
  const overview=renderToStaticMarkup(createElement(CycleOverview,{
   locale:"fr",context,teamHref:"/app/team/team-authorisee",
   cycle:{...sprint("sprintA"),startAt:"2098-11-09T08:00:00Z",
    endAt:"2098-11-22T22:59:59Z"},projection
  }));
  assert.match(overview,/SP initialement engagés/);
  assert.match(overview,/Jours ouvrés restants/);
  assert.match(overview,/Sprint à venir/);
 });
 it("langues, accessibilité et grille 4/2/1 colonnes : aucun libellé manquant",()=>{
  const fr=JSON.parse(file("src/i18n/fr.json")) as Record<string,unknown>;
  const en=JSON.parse(file("src/i18n/en.json")) as Record<string,unknown>;
  const flatten=(obj:unknown,prefix=""):string[]=>obj&&typeof obj==="object"&&!Array.isArray(obj)?
   Object.entries(obj).flatMap(([key,val])=>flatten(val,prefix?prefix+"."+key:key)):
   [prefix];
  const frKeys=flatten(fr),enKeys=flatten(en);
  for(const k of frKeys)assert.ok(enKeys.includes(k),"missing EN key "+k);
  for(const k of enKeys)assert.ok(frKeys.includes(k),"missing FR key "+k);
  for(const locale of ["fr","en"] as const){
   for(const key of ["dashboard.cockpit.todayIncludedProvisional",
    "dashboard.cockpit.metricSnapshot","dashboard.operational.eventHeld",
    "dashboard.operational.eventReconstructed","sprintTickets.title"] as const){
    const label=translate(locale,key);
    assert.ok(label.length>0,"missing "+locale+" "+key);
    assert.doesNotMatch(label,/translation unavailable|traduction indisponible/i);
   }
  }
  const css=file("src/app/dashboard.css");
  assert.match(css,/\.smn-metric-grid\s*\{\s*display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css,/@container \(max-width:1000px\)/);
  assert.match(css,/@container \(max-width:650px\)/);
  assert.match(css,/\.smn-operational-grid\s*\{grid-template-columns:minmax\(0,1fr\);\}/);
 });
 it("pas de faux état Aucun cycle créé lors d'une panne PostgreSQL",()=>{
  const page=file("src/app/app/page.tsx");
  assert.match(page,/sprintResult===null&&<p role="alert"/);
  assert.match(page,/sprintResult!==null&&<>/);
  assert.match(page,/withDashboardRead\(async db=>/);
  assert.match(page,/readSprintContext\(db,context.teamId\)/);
  assert.match(page,/readCycleDashboard\(db,context.teamId,cycle,account.role==="admin"\)/);
  assert.match(file("src/server/dashboard/read-only-db.ts"),
   /BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/);
 });
 it("la Story des risques/notes n'est pas simulée et SMN-86 demeure indépendante",()=>{
  const operational=file("src/app/app/operational-overview.tsx");
  assert.match(operational,/if\(definition.id==="events"\)/);
  assert.match(operational,/projection&&timeZone\?/);
  assert.match(operational,/UnavailableColumn/);
  const projectionSource=file("src/server/dashboard/cycle-reader.ts");
  assert.match(projectionSource,/readCycleRegistry\(db,teamId,sprint.id/);
  assert.match(projectionSource,/readCycleNotesAndAlerts\(db,teamId,sprint.id\)/);
  assert.match(projectionSource,/obstacles,risks,notesAndAlerts/);
  assert.match(file("src/server/dashboard/events-reader.ts"),
   /COALESCE\(occurrence_status,'unknown'\) AS status/);
 });
});
