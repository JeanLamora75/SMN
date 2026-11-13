import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {
 validateOfficeTicketRequest,readOfficeTicketProjection,OfficeTicketSourceError,
 officeTicketSources,discoverOfficeTicketSources,
} from "../src/server/reports/office-ticket-rows";
import {saveTicketSnapshot,type TicketScope} from "../src/server/tickets/snapshot-storage";
import {writeZip} from "../scripts/smn-397-office-poc.mjs";
import {expandWordTablesXml} from "../scripts/smn-400-word-tables.mjs";
import {expandPowerPointTablesXml} from "../scripts/smn-401-powerpoint-tables.mjs";

const scope:TicketScope={teamId:"team-one",mode:"scrum",cycleId:"sprint-one"};
const header="Id jira,Type de ticket,Titre du ticket,Priorité,Statut,Story points";
const csv1=[header,"ABC-1,Story,À faire,High,In Progress,2","ABC-2,Bug,Erreur,Low,Done,3"].join("\n");
const csv2=[header,"ABC-1,Story,À faire,High,Terminé,5","ABC-3,Task,Nouveau,Low,À faire,1"].join("\n");
const opts={authorize:async()=>{}};
function ref(meta:{snapshotId:string;businessDate:string;sha256:string}){
 return {snapshotId:meta.snapshotId,businessDate:meta.businessDate,sha256:meta.sha256};
}
test("SMN-455 : requêtes Office strictes, version et empreinte nécessaires",()=>{
 const first=ref({snapshotId:randomUUID(),businessDate:"2025-06-12",sha256:"a".repeat(64)});
 assert.deepEqual(validateOfficeTicketRequest({current:first}),{current:first});
 assert.equal(validateOfficeTicketRequest({current:{...first,sha256:"bad"}}),null);
 assert.equal(validateOfficeTicketRequest({current:first,previous:{...first}}),null);
 assert.equal(validateOfficeTicketRequest({current:first,unexpected:true}),null);
 assert.equal(validateOfficeTicketRequest({current:{...first,businessDate:"2025-02-30"}}),null);
});
test("SMN-455 : découverte des marqueurs Word et PPTX uniquement",()=>{
 const word=writeZip([
  {name:"word/document.xml",data:Buffer.from("<w:p><w:t>{{ROW:TICKETS}}</w:t></w:p>")},
  {name:"word/header1.xml",data:Buffer.from("<w:t>{{ROW:TICKET_SUMMARY}}</w:t>")},
  {name:"custom.xml",data:Buffer.from("<x>{{ROW:TICKET_CHANGES}}</x>")},
 ]);
 assert.deepEqual(discoverOfficeTicketSources(word).sort(),["TICKETS","TICKET_SUMMARY"]);
 const ppt=writeZip([{name:"ppt/slides/slide1.xml",
  data:Buffer.from("<a:t>{{ROW:TICKET_CHANGES}}</a:t><a:t>{{ROW:TICKET_COMPARE_SUMMARY}}</a:t>")}]);
 assert.deepEqual(discoverOfficeTicketSources(ppt).sort(),["TICKET_CHANGES","TICKET_COMPARE_SUMMARY"]);
 assert.equal(officeTicketSources.length,4);
});
test("SMN-455 : tableaux et synthèses du moteur commun avec provenance vérifiée",async t=>{
 const directory=await mkdtemp(path.join(tmpdir(),"smn-office-tickets-"));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 const previous=await saveTicketSnapshot(scope,{
  businessDate:"2025-06-10",filename:"before.csv",csv:csv1,actorId:"tester",
 },{...opts,directory});
 const current=await saveTicketSnapshot(scope,{
  businessDate:"2025-06-17",filename:"after.csv",csv:csv2,actorId:"tester",
 },{...opts,directory});
 const old=process.env.SMN_TICKETS_DIR;
 process.env.SMN_TICKETS_DIR=directory;
 try{
  const data=await readOfficeTicketProjection(scope,{
   current:ref(current),previous:ref(previous),
  },["TICKETS","TICKET_SUMMARY","TICKET_CHANGES","TICKET_COMPARE_SUMMARY"]);
  assert.equal(data.provenance.current.sha256,current.sha256);
  assert.equal(data.provenance.previous?.snapshotId,previous.snapshotId);
  assert.equal(data.rows.TICKETS?.length,2);
  assert.equal(data.rows.TICKET_SUMMARY?.[0].TICKET_SP_SUM,"6");
  assert.equal(data.rows.TICKET_SUMMARY?.[0].TICKET_COMPLETED,"1");
  assert.equal(data.rows.TICKET_CHANGES?.length,3);
  assert.equal(data.rows.TICKET_COMPARE_SUMMARY?.[0].TICKET_ADDED,"1");
  assert.equal(data.rows.TICKET_COMPARE_SUMMARY?.[0].TICKET_REMOVED,"1");
  assert.equal(data.rows.TICKET_COMPARE_SUMMARY?.[0].TICKET_COMPLETED,"1");
  assert.equal(data.rows.TICKET_COMPARE_SUMMARY?.[0].TICKET_CHANGED_DISTINCT,"3");
  await assert.rejects(readOfficeTicketProjection(scope,{
   current:{...ref(current),sha256:"a".repeat(64)},
  },["TICKETS"]),error=>error instanceof OfficeTicketSourceError&&error.code==="stale-snapshot");
  await assert.rejects(readOfficeTicketProjection(scope,{
   current:ref(current),
  },["TICKET_CHANGES"]),error=>error instanceof OfficeTicketSourceError&&error.code==="previous-required");
 }finally{
  if(old===undefined)delete process.env.SMN_TICKETS_DIR;
  else process.env.SMN_TICKETS_DIR=old;
 }
});
test("SMN-455 : le générateur Office réutilise les quatre familles, sans écrire les indicateurs",()=>{
 const code=readFileSync("src/app/api/admin/reports/office-templates/generate/route.ts","utf8");
 for(const token of ["discoverOfficeTicketSources","validateOfficeTicketRequest",
  "readOfficeTicketProjection","TICKET_SOURCE_SHA256","TICKET_PREVIOUS_SHA256",
  "Object.assign(payload.rows,ticketProjection.rows)","generateWordTables","generatePowerPointTables"])
  assert.ok(code.includes(token),token);
 assert.match(code,/input.expectedFingerprint!=="absent"/);
 const projection=readFileSync("src/server/reports/office-ticket-rows.ts","utf8");
 assert.doesNotMatch(projection,/writeManualValues|UPDATE public|INSERT INTO|DELETE FROM/);
});
test("SMN-455 : choix des snapshots et documentation des tags dans le centre Rapports",()=>{
 const ui=readFileSync("src/app/app/reports/office-template-catalog.tsx","utf8");
 assert.match(ui,/smn-office-ticket-source/);
 assert.match(ui,/ticketOptions\(\)/);
 assert.match(ui,/ticketSelected/);
 assert.match(ui,/ticketPrevious/);
 const docs=readFileSync("src/app/app/reports/office-tags.tsx","utf8");
 for(const tag of ["TICKETS","TICKET_SUMMARY","TICKET_CHANGES","TICKET_COMPARE_SUMMARY",
  "TICKET_SOURCE_DATE","TICKET_SOURCE_SHA256"])
  assert.ok(docs.includes(tag),tag);
});

test("SMN-455 : réelle expansion des sources ROW Tickets dans Word et PowerPoint",()=>{
 const rows={TICKETS:[
  {TICKET_ID:"ABC-1",TICKET_TITLE:"Première tâche"},
  {TICKET_ID:"ABC-2",TICKET_TITLE:"Seconde tâche"},
 ]};
 const word='<w:tbl><w:tr><w:tc><w:p><w:r><w:t>{{ROW:TICKETS}}</w:t></w:r></w:p></w:tc>'+
  '<w:tc><w:p><w:r><w:t>{{TICKET_ID}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
 const expandedWord=expandWordTablesXml(word,rows,"fr");
 assert.equal(expandedWord.tableRows,1);
 assert.match(expandedWord.xml,/ABC-1/);
 assert.match(expandedWord.xml,/ABC-2/);
 assert.doesNotMatch(expandedWord.xml,/ROW:TICKETS/);
 const ppt='<a:tbl><a:tr><a:tc><a:txBody><a:p><a:r><a:t>{{ROW:TICKETS}}</a:t></a:r></a:p></a:txBody></a:tc>'+
  '<a:tc><a:txBody><a:p><a:r><a:t>{{TICKET_ID}}</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl>';
 const expandedPpt=expandPowerPointTablesXml(ppt,rows,"fr");
 assert.equal(expandedPpt.tableRows,1);
 assert.match(expandedPpt.xml,/ABC-1/);
 assert.match(expandedPpt.xml,/ABC-2/);
 assert.doesNotMatch(expandedPpt.xml,/ROW:TICKETS/);
});
