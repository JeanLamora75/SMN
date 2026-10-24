import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {Client} from "pg";
import OperationalOverview from "../src/app/app/operational-overview";
import {dashboardEventIcon,formatDashboardEventPeriod}
 from "../src/lib/dashboard-card-format";
import {readCycleRegistry,readCycleNotesAndAlerts}
 from "../src/server/dashboard/attention-reader";
import {collectionAvailable,collectionUnavailable,metricNotRecorded,
 type CollectiveCycleProjection,type DashboardAttention,type DashboardEvent}
 from "../src/lib/dashboard-data-contract";

const empty=collectionUnavailable("producer-not-ready");
function projection(overrides:Partial<CollectiveCycleProjection>):CollectiveCycleProjection{
 const metric=metricNotRecorded();
 return {teamId:"team-1",cycleId:"sprint-1",cycleStatus:"active",snapshotVersion:null,
  goals:empty,capacity:{initialJh:metric,actualJh:metric},
  storyPoints:{initial:metric,done:metric},tickets:{initial:metric,done:metric},
  workingDaysRemaining:metric,events:empty,obstacles:empty,risks:empty,
  notesAndAlerts:empty,...overrides};
}
const available=<T,>(items:readonly T[])=>collectionAvailable(items,items.length,{source:"manual"});
const html=(p:CollectiveCycleProjection,locale:"fr"|"en"="fr")=>
 renderToStaticMarkup(createElement(OperationalOverview,{locale,projection:p,
  timeZone:"Europe/Paris",canManage:true}));

test("les dates des cérémonies ne répètent pas le même jour et respectent FR/EN et Paris",()=>{
 assert.equal(formatDashboardEventPeriod("2026-10-23T07:00:00Z","2026-10-23T07:15:00Z","fr","Europe/Paris"),
  "Ven. 23 oct. : 09:00 — 09:15");
 assert.match(formatDashboardEventPeriod("2026-10-23T07:00:00Z","2026-10-23T07:15:00Z","en","Europe/Paris"),
  /Fri 23 Oct : 09:00 — 09:15/);
 const overnight=formatDashboardEventPeriod("2026-10-23T21:30:00Z","2026-10-23T23:30:00Z","fr","Europe/Paris");
 assert.match(overnight,/Ven\. 23 oct\. : 23:30/);
 assert.match(overnight,/Sam\. 24 oct\. : 01:30/);
 assert.equal(formatDashboardEventPeriod("bad","bad","fr","Europe/Paris"),"—");
});

test("les icônes Bootstrap sont identifiables sans classer abusivement un modèle inconnu",()=>{
 const names=["daily","Sprint Planning","review","Rétrospective","Affinage","Atelier personnalisé"];
 assert.deepEqual(names.map(title=>dashboardEventIcon({kind:"template",title})),
  ["people-fill","calendar-check","bar-chart-line","chat-dots","sliders","calendar-event"]);
 assert.equal(dashboardEventIcon({kind:"exceptional",title:"Daily Scrum"}),"calendar-event");
});

test("les fiches présentent descriptions réelles, liens, responsables et badges traduits",()=>{
 const obstacle:DashboardAttention={id:"reg-1",kind:"obstacle",title:"Accès à l'environnement de test",
  description:"La machine est indisponible.",owner:"Sophie Martin",occurredOn:"2026-10-21",
  dueOn:"2026-10-25",status:"in_progress",scope:"team",
  href:"/app/admin/registries/reg-1",priority:null};
 const risk:DashboardAttention={id:"reg-2",kind:"risk",title:"Retard API",
  description:"Le service externe peut être indisponible.",status:"open",priority:"high"};
 const alert:DashboardAttention={id:"configuration:reference-country",kind:"alert",
  title:"reference-country",status:"todo",configurationKey:"reference-country"};
 const done:DashboardAttention={id:"configuration:recovery-phrase",kind:"note",
  title:"recovery-phrase",status:"done",configurationKey:"recovery-phrase"};
 const markup=html(projection({obstacles:available([obstacle]),risks:available([risk]),
  notesAndAlerts:available([alert,done])}));
 assert.match(markup,/La machine est indisponible/);
 assert.match(markup,/Sophie Martin/);
 assert.match(markup,/Équipe · sans Sprint/);
 assert.match(markup,/En cours/);
 assert.match(markup,/class="smn-attention-card-description"/);
 assert.match(markup,/data-priority="high"/);
 assert.match(markup,/Définir le pays de référence/);
 assert.match(markup,/Valeur proposée pour les futurs membres/);
 assert.match(markup,/href="\/app\/security"/);
 assert.match(markup,/data-status="done"/);
 assert.match(markup,/href="\/app\/admin\/registries\?type=obstacle"/);
 assert.match(markup,/href="\/app\/admin\/registries\?type=risk"/);
 assert.equal((markup.match(/class="smn-operational-create-link"/g)??[]).length,4);
 const translated=html(projection({obstacles:available([obstacle])}),"en");
 assert.match(translated,/In progress/);
 assert.match(translated,/Team · not linked to a sprint/);
});

test("cinq événements maximum ont une icône différente et la fiche reste cliquable",()=>{
 const entries:DashboardEvent[]=Array.from({length:6},(_,i)=>({
  id:"event-"+i,kind:"template",title:i===0?"Daily Scrum":"Sprint Review",
  startsAt:"2026-10-23T07:00:00Z",endsAt:"2026-10-23T07:15:00Z",
  status:"held",generationSource:null
 }));
 const markup=html(projection({events:collectionAvailable(entries,6,{source:"recorded-events"})}));
 assert.equal((markup.match(/class="smn-dashboard-event"/g)??[]).length,5);
 assert.match(markup,/bi-people-fill/);
 assert.match(markup,/bi-bar-chart-line/);
 assert.match(markup,/Ven\. 23 oct\. : 09:00/);
 assert.match(markup,/meeting\/template\/event-0/);
 assert.match(markup,/Tenue/);
});

test("le lecteur des registres transmet uniquement les attributs réellement persistés",async()=>{
 const queries:string[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  queries.push(sql);
  if(sql.includes("to_regclass"))return {rows:[{present:params[0]==="public.smn_registry_item"}]};
  if(sql.includes("COUNT(*)"))return {rows:[{total:1}]};
  return {rows:[{id:"r-1",title:"Blocage",status:"open",scope:"team",
   description:"Description conservée",owner_name:"Sophie",due_on:"2026-10-28",
   occurred_on:"2026-10-20",probability:null,impact:null}]};
 }} as unknown as Client;
 const projected=await readCycleRegistry(db,"team-1","sprint-1","obstacle");
 assert.equal(projected.state,"available");
 if(projected.state==="available"){
  assert.equal(projected.items[0].description,"Description conservée");
  assert.equal(projected.items[0].owner,"Sophie");
  assert.equal(projected.items[0].dueOn,"2026-10-28");
  assert.equal(projected.items[0].priority,null);
 }
 assert.ok(queries.some(sql=>sql.includes("r.description,r.owner_name,r.due_on::text")));
 assert.ok(queries.every(sql=>!/\b(?:INSERT|DELETE|UPDATE|CREATE|ALTER)\b/i.test(sql)));
});

test("configuration: ignorée exclue, terminée informative, todo alerte",async()=>{
 const db={query:async(sql:string)=>{
  if(sql.includes("to_regclass"))return {rows:[{present:true}]};
  if(sql.includes("smn_dashboard_note"))return {rows:[]};
  return {rows:[
   {task_key:"reference-country",status:"todo"},
   {task_key:"recovery-phrase",status:"done"},
   {task_key:"display-preferences",status:"ignored"}
  ]};
 }} as unknown as Client;
 const read=await readCycleNotesAndAlerts(db,"team-1","sprint-1");
 assert.equal(read.state,"available");
 if(read.state==="available"){
  assert.equal(read.total,2);
  assert.deepEqual(read.items.map(x=>x.kind),["alert","note"]);
 }
});
