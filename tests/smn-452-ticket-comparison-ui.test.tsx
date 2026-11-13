import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {LocaleProvider} from "../src/i18n/client";
import {pickComparisonDefaults} from "../src/app/app/tickets/tickets-comparison";
import TicketsComparison from "../src/app/app/tickets/tickets-comparison";
import type {TicketsCycleContext} from "../src/app/app/tickets-cycle-context";
import {translate} from "../src/i18n/catalog";

const snapshots=[
 {snapshotId:"id-new",businessDate:"2025-05-17",originalFilename:"new.csv"},
 {snapshotId:"id-early",businessDate:"2025-05-03",originalFilename:"early.csv"},
 {snapshotId:"id-middle",businessDate:"2025-05-10",originalFilename:"middle.csv"},
];
const context:TicketsCycleContext={
 teamId:"team-1",cycleId:"sprint-3",mode:"scrum",role:"admin",
 cycleName:"Sprint 3",cycleStatus:"active",state:"ready",
};
test("SMN-452 : présélectionner les deux photographies aux dates métier les plus récentes",()=>{
 assert.deepEqual(pickComparisonDefaults(snapshots),["id-middle","id-new"]);
 assert.deepEqual(pickComparisonDefaults(snapshots.slice(0,1)),["",""]);
 assert.deepEqual(pickComparisonDefaults([]),["",""]);
 assert.deepEqual(pickComparisonDefaults([...snapshots].reverse()),["id-middle","id-new"]);
});
test("SMN-452 : écran Cockpit Agile, sélecteurs datés, sections séparées",()=>{
 const html=renderToStaticMarkup(<LocaleProvider locale="fr">
  <TicketsComparison context={context} snapshots={snapshots} onBack={()=>{}}/>
 </LocaleProvider>);
 for(const className of ["smn-tickets-compare","smn-tickets-panel",
  "smn-tickets-compare-selectors","smn-tickets-compare-summary",
  "smn-tickets-compare-filters","smn-tickets-compare-results"]){
  assert.ok(html.includes(className),className);
 }
 assert.match(html,/Photographie ancienne/);
 assert.match(html,/Photographie récente/);
 assert.match(html,/middle\.csv/);
 assert.match(html,/new\.csv/);
 assert.match(html,/id-middle/);
 assert.match(html,/id-new/);
});
test("SMN-452 : un seul fichier explique que la comparaison est indisponible",()=>{
 const html=renderToStaticMarkup(<LocaleProvider locale="fr">
  <TicketsComparison context={context} snapshots={snapshots.slice(0,1)} onBack={()=>{}}/>
 </LocaleProvider>);
 assert.match(html,/Il faut au moins deux fichiers CSV/);
 assert.doesNotMatch(html,/smn-tickets-compare-results/);
});
test("SMN-452 : interface bilingue sans libellés métier non traduits",()=>{
 for(const locale of ["fr","en"] as const){
  const html=renderToStaticMarkup(<LocaleProvider locale={locale}>
   <TicketsComparison context={context} snapshots={snapshots} onBack={()=>{}}/>
  </LocaleProvider>);
  assert.match(html,locale==="fr"?/Synthèse des évolutions/:/Change summary/);
  for(const key of ["compareTitle","compareNotEnough","compareAdded","compareRemoved",
   "compareCompleted","compareReopened","compareChanged","compareExplanations",
   "compareMissing","compareSearch","compareOther","compareCount"]){
   const value=translate(locale,("tickets."+key) as Parameters<typeof translate>[1]);
   assert.ok(value.length>0);
   assert.doesNotMatch(value,/translation unavailable|traduction indisponible/i);
  }
 }
});
test("SMN-452 : l'API applique les filtres avant pagination et garde les totaux globaux",()=>{
 const code=readFileSync("src/app/api/admin/tickets/compare/route.ts","utf8");
 assert.match(code,/kind=params\.get\("kind"\)/);
 assert.match(code,/normalizedSearch/);
 assert.match(code,/compared\.changes\.filter/);
 assert.ok(code.indexOf("compared.changes.filter")<code.indexOf("filtered.slice"));
 assert.match(code,/counts:compared\.counts/);
 assert.match(code,/stale-snapshot/);
 assert.match(code,/readTicketSnapshot/);
 assert.doesNotMatch(code,/saveTicketSnapshot|INSERT INTO|UPDATE public|DELETE FROM/);
});
test("SMN-452 : onglet Comparaison et bouton header actifs pour deux fichiers",()=>{
 const code=readFileSync("src/app/app/tickets/tickets-files.tsx","utf8");
 assert.match(code,/items\.length<2/);
 assert.match(code,/setActiveTab\("compare"\)/);
 assert.match(code,/<TicketsComparison/);
 assert.match(code,/onBack=\{\(\)=>setActiveTab\("files"\)\}/);
});
