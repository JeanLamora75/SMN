import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {LocaleProvider} from "../src/i18n/client";
import {TicketsCycleProvider,useTicketsCycle,type TicketsCycleContext} from "../src/app/app/tickets-cycle-context";
import {privateNavigation,activePrivateEntry} from "../src/lib/private-navigation";
import {teamSwitchDestination} from "../src/lib/team-navigation";

const base:TicketsCycleContext={
 teamId:"team_1",mode:"scrum",role:"admin",cycleId:"sprint_1",
 cycleName:"Sprint 11",cycleStatus:"active",state:"ready",
};
const source=readFileSync("src/app/app/tickets/tickets-files.tsx","utf8");
function ContextProbe(){
 const cycle=useTicketsCycle();
 return <p>{cycle.teamId} / {cycle.cycleName} / {cycle.mode}</p>;
}
function renderContext(context:TicketsCycleContext=base,locale:"fr"|"en"="fr"){
 return renderToStaticMarkup(<LocaleProvider locale={locale}>
  <TicketsCycleProvider value={context}><ContextProbe/></TicketsCycleProvider>
 </LocaleProvider>);
}

test("SMN-447 — Tickets reste accessible au rôle admin et utilisateur en Scrum et Kanban",()=>{
 for(const mode of ["scrum","kanban"] as const)
  for(const role of ["admin","user"] as const){
   const entries=privateNavigation(mode,role).flatMap(group=>group.entries);
   const tickets=entries.find(entry=>entry.id==="tickets");
   assert.equal(tickets?.href,"/app/tickets");
   assert.equal(tickets?.label,"tickets.navigation");
   const ids=entries.map(entry=>entry.id);
   assert.equal(ids.indexOf("tickets"),ids.indexOf("cycles")+1);
   assert.equal(ids.indexOf("centralCalendar"),ids.indexOf("tickets")+1);
   assert.ok(tickets&&activePrivateEntry("/app/tickets",tickets));
   assert.ok(tickets&&activePrivateEntry("/app/tickets/detail",tickets));
  }
});

test("SMN-447 — le Provider transmet effectivement équipe, mode et cycle",()=>{
 assert.match(renderContext(),/team_1 \/ Sprint 11 \/ scrum/);
 assert.match(renderContext({...base,teamId:"team_2",mode:"kanban",cycleName:"Période 2"}),/team_2 \/ Période 2 \/ kanban/);
});

test("SMN-447 — le contenu Cockpit Agile conserve ses blocs et ses onglets",()=>{
 for(const marker of [
  "smn-tickets-hero","smn-tickets-layout","smn-tickets-files",
  "smn-tickets-summary","smn-tickets-files-tab",
  "smn-tickets-browse-tab","smn-tickets-compare-tab",
  "smn-tickets-files-panel","smn-tickets-browse-panel","smn-tickets-compare-panel",
 ])
  assert.ok(source.includes(marker),marker);
 assert.match(source,/role="tabpanel"/);
 assert.match(source,/aria-selected=\{activeTab==="files"\}/);
 assert.match(source,/aria-selected=\{activeTab==="browse"\}/);
 assert.match(source,/aria-selected=\{activeTab==="compare"\}/);
});

test("SMN-447 — actions réellement raccordées aux Stories 448, 449, 452 et 453",()=>{
 for(const required of [
  "TicketsImportDialog","TicketsConsultation","TicketsComparison",
  "UniversalIndicatorInput","setImportOpen(true)","setActiveTab(\"browse\")",
  "setActiveTab(\"compare\")",
 ])
  assert.ok(source.includes(required),required);
 assert.match(source,/disabled=\{state!=="ready"\|\|items.length<2\}/);
 assert.match(source,/disabled=\{!canImport\}/);
});

test("SMN-447 — changement de l'équipe et sélection obsolète remis à zéro",()=>{
 assert.equal(teamSwitchDestination("/app/tickets","team_2","scrum"),"/app/tickets?teamId=team_2");
 assert.equal(teamSwitchDestination("/app/tickets","team_2","kanban"),"/app/tickets?teamId=team_2");
 assert.match(source,/setSelectedId\(null\)/);
 assert.match(source,/setActiveTab\("files"\)/);
 assert.match(source,/if\(ctrl.signal.aborted\)return/);
});

test("Le bouton Select conserve sa surbrillance selon la photographie active",()=>{
 assert.match(source,/item\.snapshotId===selectedId\?"btn-primary is-selected":"btn-outline-primary"/);
 assert.match(source,/aria-pressed=\{item\.snapshotId===selectedId\}/);
 assert.match(source,/onClick=\{\(\)=>setSelectedId\(item\.snapshotId\)\}/);
 assert.match(source,/onClick=\{\(\)=>\{setSelectedId\(item\.snapshotId\);setActiveTab\("browse"\);\}\}/);
});
