import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {LocaleProvider} from "../src/i18n/client";
import {browseTicketCsv,jiraPrefix} from "../src/lib/ticket-csv-browse";
import TicketsConsultation from "../src/app/app/tickets/tickets-consultation";
import type {TicketsCycleContext} from "../src/app/app/tickets-cycle-context";
import {translate} from "../src/i18n/catalog";

const header="Id jira,Type de ticket,Titre du ticket,Priorité,Statut,Story points";
const csv=[header,
 "PRO-20,Bug,Recherche cassée,Haute,Done,3",
 "PRO-2,Story,Connexion utilisateur,Basse,Terminé,8",
 "OPS-1,Bug,Erreur connexion,Haute,In Progress,",
 "OPS-3,Task,Suivi quotidien,Custom,À faire,inconnu",
 "PRO-25,Story,Revue sprint,Haute,Doing,2",
].join("\n");
const ctx:TicketsCycleContext={teamId:"team_1",cycleId:"cycle_1",mode:"scrum",role:"admin",
 cycleName:"Sprint 3",cycleStatus:"active",state:"ready"};

test("projection sur une photographie, clés et valeurs conservées",()=>{
 const result=browseTicketCsv(csv);
 assert.equal(result.sourceCount,5);
 assert.equal(result.total,5);
 assert.equal(result.rows.length,5);
 assert.equal(result.rows[0].jiraId,"OPS-1");
 assert.equal(result.rows.find(row=>row.jiraId==="OPS-3")?.storyPoints,"inconnu");
 assert.equal(jiraPrefix("OPS-12"),"OPS");
 assert.equal(jiraPrefix("cle-libre"),"cle");
 assert.equal(jiraPrefix("sansprefixe"),"");
});

test("recherche accent-insensible, filtres indépendants, facettes sur CSV entier",()=>{
 const filtered=browseTicketCsv(csv,{search:"connexion",issueType:"Bug"});
 assert.equal(filtered.total,1);
 assert.equal(filtered.rows[0].jiraId,"OPS-1");
 assert.deepEqual(filtered.facets.prefixes,["OPS","PRO"]);
 assert.deepEqual(filtered.facets.issueTypes,["Bug","Story","Task"]);
 assert.equal(browseTicketCsv(csv,{status:"Terminé"}).rows[0].completed,true);
 assert.equal(browseTicketCsv(csv,{status:"Done"}).rows[0].completed,true);
 assert.equal(browseTicketCsv(csv,{status:"Doing"}).rows[0].completed,false);
});

test("tri naturel des clés, tri numérique des SP et données inconnues sans zéro",()=>{
 const byId=browseTicketCsv(csv,{prefix:"PRO",sort:"jiraId"});
 assert.deepEqual(byId.rows.map(row=>row.jiraId),["PRO-2","PRO-20","PRO-25"]);
 const byPoints=browseTicketCsv(csv,{sort:"storyPoints",direction:"desc"});
 assert.deepEqual(byPoints.rows.slice(0,3).map(row=>row.storyPoints),["8","3","2"]);
 assert.equal(byPoints.rows.at(-1)?.storyPoints,"inconnu");
});

test("pagination bornée, page trop haute ramenée à la dernière",()=>{
 const twentyFive=[header,...Array.from({length:51},(_,i)=>
  `TEAM-${i+1},Task,Ticket ${i+1},Normal,À faire,${i}`)].join("\n");
 const page1=browseTicketCsv(twentyFive,{page:1,pageSize:25});
 assert.equal(page1.rows.length,25);
 assert.equal(page1.pageCount,3);
 const page3=browseTicketCsv(twentyFive,{page:999,pageSize:25});
 assert.equal(page3.page,3);
 assert.equal(page3.rows.length,1);
 assert.equal(browseTicketCsv(twentyFive,{pageSize:999}).pageSize,50);
});

test("CSV non conforme refusé avant consultation",()=>{
 assert.throws(()=>browseTicketCsv("Id jira,Statut\nAB-1,Done"),/tickets-invalid-csv/);
});

test("Cockpit Agile et états vides traduits sans inventer de lien Jira",()=>{
 for(const locale of ["fr","en"] as const){
  const markup=renderToStaticMarkup(
   <LocaleProvider locale={locale}>
    <TicketsConsultation snapshot={null} context={ctx} onBack={()=>{}}/>
   </LocaleProvider>);
  assert.match(markup,/smn-tickets-panel/);
  assert.match(markup,locale==="fr"?/Sélectionnez d&#x27;abord un fichier/:/Select a file/);
  assert.doesNotMatch(markup,/href="https:\/\/.*browse\//);
  for(const key of ["tickets.browseFilters","tickets.browseResults","tickets.browseJiraLinkPending"] as const){
   assert.doesNotMatch(translate(locale,key),/translation unavailable|traduction indisponible/i);
  }
 }
});

test("L'API de consultation vérifie le compte, le cycle, la version et ne modifie pas le CSV",()=>{
 const src=readFileSync("src/app/api/admin/tickets/browse/route.ts","utf8");
 for(const expected of ["authorizeApi","public.smn_account","c.team_id=$2",
  "readTicketSnapshot","snapshotId","stale-snapshot","browseTicketCsv","Cache-Control"])
  assert.ok(src.includes(expected),expected);
 assert.doesNotMatch(src,/saveTicketSnapshot|INSERT INTO|UPDATE public|DELETE FROM/);
});
