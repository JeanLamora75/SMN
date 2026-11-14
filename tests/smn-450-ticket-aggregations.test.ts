import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {browseTicketCsv} from "../src/lib/ticket-csv-browse";
import {summarizeTicketRows} from "../src/lib/ticket-csv-summary";
import {translate} from "../src/i18n/catalog";

const header="id,type,resume,priority,status,sp";
const sample=[
 header,
 "ALPHA-1,Bug,Erreur d'affichage,Haute,Done,0",
 "ALPHA-2,Bug,Erreur de formulaire,Haute,Terminé,\"1,25\"",
 "BETA-3,Story,Une évolution,Moyenne,In Progress,2",
 "BETA-4,Story,Une autre évolution,Moyenne,Doing,",
 "ALPHA-5,Task,Une vérification,Basse,À faire,inconnu",
 "ALPHA-6,Task,Contrôle,Faible,Done,0.75",
].join("\n");

test("SMN-450 — total décimal exact, zéro différent de manquant et invalide",()=>{
 const s=browseTicketCsv(sample).summary.all;
 assert.equal(s.ticketCount,6);
 assert.equal(s.completedCount,3);
 assert.equal(s.storyPoints.sum,"4");
 assert.equal(s.storyPoints.numericCount,4);
 assert.equal(s.storyPoints.missingCount,1);
 assert.equal(s.storyPoints.invalidCount,1);
 assert.deepEqual(s.byType.map(({value,count})=>({value,count})),[{value:"Bug",count:2},{value:"Story",count:2},{value:"Task",count:2}]);
 assert.equal(s.byType.find(x=>x.value==="Bug")?.storyPoints.sum,"1.25");
 assert.equal(s.byType.find(x=>x.value==="Story")?.storyPoints.sum,"2");
 assert.equal(s.byType.find(x=>x.value==="Task")?.storyPoints.sum,"0.75");
 assert.deepEqual(s.byPrefix.map(({value,count})=>({value,count})),[{value:"ALPHA",count:4},{value:"BETA",count:2}]);
 assert.equal(s.byPrefix.find(x=>x.value==="ALPHA")?.storyPoints.sum,"2");
 assert.equal(s.byPrefix.find(x=>x.value==="BETA")?.storyPoints.sum,"2");
 assert.equal(s.byStatus.find(x=>x.value==="Done")?.count,2);
 assert.equal(s.byStatus.find(x=>x.value==="Done")?.storyPoints.sum,"0.75");
 assert.equal(s.byStatus.find(x=>x.value==="Terminé")?.count,1);
 assert.equal(s.byStatus.find(x=>x.value==="Terminé")?.storyPoints.sum,"1.25");
});

test("SMN-450 — périmètres entier et filtré indépendants, sans dépendance à la pagination",()=>{
 const all=browseTicketCsv(sample,{issueType:"Bug",page:1,pageSize:25});
 assert.equal(all.summary.all.ticketCount,6);
 assert.equal(all.summary.filtered.ticketCount,2);
 assert.equal(all.summary.filtered.storyPoints.sum,"1.25");
 assert.equal(all.summary.filtered.byType[0].storyPoints.sum,"1.25");
 assert.equal(all.summary.filtered.byPrefix[0].storyPoints.sum,"1.25");
 assert.equal(all.summary.filtered.completedCount,2);
 assert.equal(all.summary.filtered.storyPoints.numericCount,2);
 const narrowed=browseTicketCsv(sample,{status:"Doing"});
 assert.equal(narrowed.summary.filtered.storyPoints.sum,null);
 assert.equal(narrowed.summary.filtered.byStatus[0].storyPoints.sum,null);
 assert.equal(narrowed.summary.filtered.byStatus[0].storyPoints.missingCount,1);
 assert.equal(narrowed.summary.filtered.storyPoints.missingCount,1);
 assert.equal(narrowed.summary.all.storyPoints.sum,"4");
 const noMatch=browseTicketCsv(sample,{search:"introuvable"});
 assert.equal(noMatch.summary.filtered.ticketCount,0);
 assert.equal(noMatch.summary.filtered.storyPoints.sum,null);
 assert.deepEqual(noMatch.summary.filtered.byPrefix,[]);
});

test("SMN-450 — ne pas convertir les SP absents ou non numériques en zéro",()=>{
 const s=browseTicketCsv([header,
  "A-1,Story,Inconnu,Haute,Done,",
  "A-2,Story,Inconnu,Basse,Done,ND",
 ].join("\n")).summary.filtered;
 assert.equal(s.storyPoints.sum,null);
 assert.equal(s.storyPoints.missingCount,1);
 assert.equal(s.storyPoints.invalidCount,1);
 assert.equal(s.storyPoints.numericCount,0);
 const zero=browseTicketCsv(header+"\nA-1,Story,Zéro,Basse,Done,0").summary.all;
 assert.equal(zero.storyPoints.sum,"0");
 assert.equal(zero.storyPoints.numericCount,1);
 assert.equal(zero.byType[0].storyPoints.sum,"0");
});

test("SMN-450 — précision exacte pour très grands décimaux",()=>{
 const c=[header,
  "T-1,Task,Une précision,Haute,Done,0.10000000000000000001",
  "T-2,Task,Une précision,Haute,Done,0.2",
  "T-3,Task,Une précision,Haute,Terminé,9999999999999999999",
 ].join("\n");
 assert.equal(browseTicketCsv(c).summary.all.storyPoints.sum,"9999999999999999999.30000000000000000001");
});

test("SMN-450 — tri des regroupements et libellés libres sans catalogue contraint",()=>{
 const summary=summarizeTicketRows([
  {line:2,jiraId:"A-1",issueType:"Personnalisé",title:"",priority:"",status:"Ready",storyPoints:"3",prefix:"A",completed:false},
  {line:3,jiraId:"A-2",issueType:"Personnalisé",title:"",priority:"",status:"Done",storyPoints:"2",prefix:"A",completed:true},
  {line:4,jiraId:"B-1",issueType:"",title:"",priority:"",status:"Terminé",storyPoints:"",prefix:"B",completed:true},
 ]);
 assert.equal(summary.ticketCount,3);
 assert.equal(summary.completedCount,2);
 assert.equal(summary.byType[0].value,"Personnalisé");
 assert.equal(summary.byType[1].value,"");
 assert.equal(summary.storyPoints.sum,"5");
 assert.equal(summary.byType[0].storyPoints.sum,"5");
 assert.equal(summary.byType[1].storyPoints.sum,null);
});

test("SMN-450 — service de consultation expose les deux périmètres avant pagination",()=>{
 const api=readFileSync("src/app/api/admin/tickets/browse/route.ts","utf8");
 const engine=readFileSync("src/lib/ticket-csv-browse.ts","utf8");
 assert.match(api,/browseTicketCsv\(stored\.csv/);
 assert.match(api,/readTicketSnapshot/);
 assert.match(engine,/all:summarizeTicketRows\(all\)/);
 assert.match(engine,/filtered:summarizeTicketRows\(filtered\)/);
 assert.ok(engine.indexOf("const summary:TicketSummaryScopes")<engine.indexOf("filtered.sort"));
 assert.doesNotMatch(engine,/INSERT INTO|UPDATE public|DELETE FROM/);
});

test("SMN-450 — écrans Cockpit Agile et i18n FR/EN des métriques",()=>{
 const ui=readFileSync("src/app/app/tickets/tickets-metrics.tsx","utf8");
 const page=readFileSync("src/app/app/tickets/tickets-consultation.tsx","utf8");
 assert.match(ui,/smn-tickets-panel smn-tickets-metrics/);
 assert.match(ui,/summary\.filtered/);
 assert.match(ui,/group\.storyPoints\.sum/);
 assert.match(ui,/tickets\.metricsGroupStoryPoints/);
 assert.match(ui,/<span aria-hidden="true"\s*\/>/);
 assert.doesNotMatch(ui,/className="visually-hidden">\{title\}<\/span>/);
 assert.match(ui,/summary\.all/);
 assert.match(page,/<TicketsMetrics summary=\{data\.summary\}/);
 for(const lang of ["fr","en"] as const)
  for(const key of ["metricsTitle","metricsFiltered","metricsAll","metricsByStatus",
   "metricsMissing","metricsInvalid","metricsNoSum","metricsByPrefix","metricsGroupStoryPoints"]){
   const value=translate(lang,("tickets."+key) as Parameters<typeof translate>[1]);
   assert.ok(value.trim());
   assert.doesNotMatch(value,/translation unavailable|traduction indisponible/i);
  }
});
