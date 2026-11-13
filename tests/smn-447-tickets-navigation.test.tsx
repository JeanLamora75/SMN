import {test} from "node:test";
import assert from "node:assert/strict";
import {renderToStaticMarkup} from "react-dom/server";
import {LocaleProvider} from "../src/i18n/client";
import {TicketsCycleProvider,type TicketsCycleContext} from "../src/app/app/tickets-cycle-context";
import TicketsFiles from "../src/app/app/tickets/tickets-files";
import {privateNavigation,activePrivateEntry} from "../src/lib/private-navigation";
import {teamSwitchDestination} from "../src/lib/team-navigation";

const base:TicketsCycleContext={
 teamId:"team_1",mode:"scrum",role:"admin",cycleId:"sprint_1",
 cycleName:"Sprint 11",cycleStatus:"active",state:"loading",
};
function render(context:TicketsCycleContext=base,locale:"fr"|"en"="fr"){
 return renderToStaticMarkup(<LocaleProvider locale={locale}><TicketsCycleProvider value={context}><TicketsFiles/></TicketsCycleProvider></LocaleProvider>);
}

test("La navigation Tickets est accessible en Scrum et Kanban, au rôle admin et user",()=>{
 for(const mode of ["scrum","kanban"] as const)
  for(const role of ["admin","user"] as const){
   const entries=privateNavigation(mode,role).flatMap(group=>group.entries);
   const tickets=entries.find(entry=>entry.id==="tickets");
   assert.equal(tickets?.href,"/app/tickets");
   assert.equal(tickets?.label,"tickets.navigation");
   assert.ok(tickets&&activePrivateEntry("/app/tickets",tickets));
   assert.ok(tickets&&activePrivateEntry("/app/tickets/detail",tickets));
  }
});

test("L'écran Cockpit Agile affiche trois onglets et les blocs distincts",()=>{
 const html=render();
 assert.match(html,/smn-tickets-hero/);
 assert.match(html,/smn-tickets-layout/);
 assert.match(html,/smn-tickets-files/);
 assert.match(html,/smn-tickets-summary/);
 assert.match(html,/Fichiers/);
 assert.match(html,/Consultation/);
 assert.match(html,/Comparaison/);
 assert.match(html,/Sprint 11/);
 assert.match(html,/Chargement des fichiers/);
 assert.match(html,/smn-cockpit-modal smn-tickets-dialog/);
 assert.match(html,/smn-cockpit-modal-header/);
 assert.match(html,/smn-cockpit-modal-footer/);
});

test("Les onglets et actions des Stories futures ne prétendent pas être fonctionnels",()=>{
 const html=render();
 assert.match(html,/aria-selected="true"/);
 assert.match(html,/Importer un CSV/);
 assert.match(html,/Indicateurs/);
 assert.match(html,/disabled=""/);
 assert.match(html,/Disponible dans une prochaine étape/);
});

test("Le mode lecture et le sprint clôturé sont explicités",()=>{
 const html=render({...base,cycleStatus:"closed",role:"user",state:"ready"}, "fr");
 assert.match(html,/Sprint clôturé/);
 assert.match(html,/Chargement des fichiers/);
 const english=render({...base,role:"user"}, "en");
 assert.match(english,/CSV snapshots/);
 assert.match(english,/Loading files/);
});

test("Le contexte de navigation équipe réinitialise l'ancien cycle",()=>{
 assert.equal(teamSwitchDestination("/app/tickets","team_2","scrum"),"/app/tickets?teamId=team_2");
 assert.equal(teamSwitchDestination("/app/tickets","team_2","kanban"),"/app/tickets?teamId=team_2");
});
