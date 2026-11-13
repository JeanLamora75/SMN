import {test} from "node:test";
import assert from "node:assert/strict";
import {compareTicketSnapshots,TicketComparisonError,type TicketSnapshotRef} from "../src/lib/ticket-csv-compare";

const header="Id jira,Type de ticket,Titre du ticket,Priorité,Statut,Story points";
const ref=(date:string,snapshotId=date,teamId="team-1",cycleId="sprint-3",mode:"scrum"|"kanban"="scrum"):TicketSnapshotRef=>
 ({teamId,cycleId,mode,snapshotId,businessDate:date});
const oldRef=ref("2025-05-10","snapshot-old"),newRef=ref("2025-05-17","snapshot-new");
const oldCsv=[header,
 "TEAM-1,Story,Identique,Normale,Done,3",
 "TEAM-2,Bug,Résoudre,Haute,In Progress,2",
 "TEAM-3,Story,Ancienne ligne,Basse,À faire,5",
 "TEAM-4,Task,Réouverture,Haute,Terminé,8",
 "TEAM-5,Bug,Pas de changement,Haute,Done,0",
 "TEAM-6,Task,Format SP,Basse,Doing,\"1,50\"",
 "TEAM-7,Task,Valeur manquante,Basse,Doing,",
].join("\n");
const newCsv=[header,
 "TEAM-1,Story,Identique,Normale,Terminé,3",
 "TEAM-2,Bug,Résoudre,Haute,Done,3",
 "TEAM-4,Task,Réouverture,Haute,In Progress,8",
 "TEAM-5,Bug,Pas de changement,Haute,Done,0",
 "TEAM-6,Task,Format SP,Basse,Doing,1.5",
 "TEAM-7,Task,Valeur manquante,Basse,Doing,0",
 "TEAM-8,Story,Nouveau ticket,Moyenne,À faire,2",
].join("\n");

function compare(olderCsv=oldCsv,newerCsv=newCsv){
 return compareTicketSnapshots({reference:oldRef,csv:olderCsv},{reference:newRef,csv:newerCsv});
}
test("SMN-451 : détecte ajouts et disparitions du CSV, sans supposer suppression Jira",()=>{
 const result=compare();
 assert.equal(result.counts.added,1);
 assert.equal(result.counts.removed,1);
 assert.deepEqual(result.changes.find(item=>item.jiraId==="TEAM-3")?.kinds,["removed"]);
 assert.deepEqual(result.changes.find(item=>item.jiraId==="TEAM-8")?.kinds,["added"]);
 assert.equal(result.counts.oldTickets,7);
 assert.equal(result.counts.newTickets,7);
 assert.equal(result.counts.sharedTickets,6);
});
test("SMN-451 : Done et Terminé ne représentent pas deux terminaisons",()=>{
 const result=compare();
 assert.equal(result.counts.completed,1);
 assert.equal(result.counts.reopened,1);
 assert.equal(result.changes.find(x=>x.jiraId==="TEAM-1")?.kinds.includes("completed"),false);
 assert.equal(result.changes.find(x=>x.jiraId==="TEAM-2")?.kinds.includes("completed"),true);
 assert.equal(result.changes.find(x=>x.jiraId==="TEAM-4")?.kinds.includes("reopened"),true);
});
test("SMN-451 : catégories non exclusives sans double comptage des tickets modifiés",()=>{
 const result=compare();
 assert.equal(result.counts.storyPointsChanged,2);
 assert.equal(result.counts.otherChanged,3);
 assert.equal(result.counts.changedTickets,6);
 assert.equal(result.counts.unchangedTickets,2);
 const both=result.changes.find(x=>x.jiraId==="TEAM-2");
 assert.deepEqual(both?.kinds,["completed","storyPointsChanged","otherChanged"]);
 assert.deepEqual(both?.fields.map(x=>x.field),["status","storyPoints"]);
 assert.equal(result.changes.length,result.counts.changedTickets);
 assert.equal(result.counts.changedTickets+result.counts.unchangedTickets,
  result.counts.sharedTickets+result.counts.added+result.counts.removed);
});
test("SMN-451 : nombres SP équivalents comparés sans erreur d'arrondi",()=>{
 const result=compare();
 assert.equal(result.changes.some(x=>x.jiraId==="TEAM-6"),false);
 assert.equal(result.changes.find(x=>x.jiraId==="TEAM-7")?.fields[0]?.field,"storyPoints");
 const old=[header,"A-1,Story,Fidèle,Haute,Done,0.10000000000000000001"].join("\n");
 const newer=[header,"A-1,Story,Fidèle,Haute,Done,0.1000000000000000000100"].join("\n");
 assert.equal(compareTicketSnapshots({reference:oldRef,csv:old},{reference:newRef,csv:newer}).counts.changedTickets,0);
});
test("SMN-451 : comparaison chronologique indépendante de l'ordre de sélection",()=>{
 const expected=compare();
 const reversed=compareTicketSnapshots({reference:newRef,csv:newCsv},{reference:oldRef,csv:oldCsv});
 assert.deepEqual(reversed,expected);
});
test("SMN-451 : refuse équipe, sprint et mode Kanban différents",()=>{
 const cases=[
  ref("2025-05-17","s2","another-team"),
  ref("2025-05-17","s2","team-1","another-sprint"),
  ref("2025-05-17","s2","team-1","sprint-3","kanban"),
 ];
 for(const other of cases){
  assert.throws(
   ()=>compareTicketSnapshots({reference:oldRef,csv:oldCsv},{reference:other,csv:newCsv}),
   (error:unknown)=>error instanceof TicketComparisonError&&error.code==="different-cycle");
 }
});
test("SMN-451 : refuse le même identifiant ou la même date métier",()=>{
 assert.throws(()=>compareTicketSnapshots({reference:oldRef,csv:oldCsv},
  {reference:ref("2025-05-17",oldRef.snapshotId),csv:newCsv}),
  (e:unknown)=>e instanceof TicketComparisonError&&e.code==="same-snapshot");
 assert.throws(()=>compareTicketSnapshots({reference:oldRef,csv:oldCsv},
  {reference:ref(oldRef.businessDate,"different-snapshot"),csv:newCsv}),
  (e:unknown)=>e instanceof TicketComparisonError&&e.code==="same-business-date");
});
test("SMN-451 : refuse CSV invalide et Jira dupliqué, sans résultat partiel",()=>{
 const missing="Id jira,Statut\nA-1,Done";
 const duplicate=[header,"ABC-1,Bug,Un,Haute,Done,1","abc-1,Bug,Deux,Haute,Terminé,3"].join("\n");
 for(const csv of [missing,duplicate]){
  assert.throws(()=>compareTicketSnapshots({reference:oldRef,csv},{reference:newRef,csv:newCsv}),
   (e:unknown)=>e instanceof TicketComparisonError&&e.code==="invalid-csv");
 }
});
test("SMN-451 : conserve les champs libres et leur provenance, sans mutation",()=>{
 const old=[header,"T-1,Custom,Ancien,P1,À faire,ND"].join("\n");
 const newer=[header,"T-1,Custom,Nouveau,P2,Ready,ND"].join("\n");
 const o={reference:oldRef,csv:old},n={reference:newRef,csv:newer};
 const before=JSON.stringify([o,n]);
 const result=compareTicketSnapshots(o,n);
 assert.deepEqual(result.changes[0].fields.map(x=>x.field),["title","priority","status"]);
 assert.equal(result.counts.storyPointsChanged,0);
 assert.equal(result.changes[0].before?.title,"Ancien");
 assert.equal(result.changes[0].after?.title,"Nouveau");
 assert.equal(JSON.stringify([o,n]),before);
});
test("SMN-451 : erreurs explicites sur date métier invalide",()=>{
 assert.throws(()=>compareTicketSnapshots({reference:ref("2025-02-30"),csv:oldCsv},
  {reference:newRef,csv:newCsv}),
  (e:unknown)=>e instanceof TicketComparisonError&&e.code==="invalid-snapshot-reference");
});
