import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {hashKanbanPayload} from "../src/server/kanban/render-reference";
import {selectKanbanReportSections} from "../src/server/kanban/report-preparation";
describe("Epic 7 C3 — Kanban frozen render references",()=>{
 const report={period:{id:"p",name:"Période",team:"Equipe",status:"finished",startOn:"2026-10-01",endOn:"2026-10-31"},flow:{started:0,throughput:null},provisional:true};
 const payload={language:"fr" as const,sections:["flow"],data:report} as Parameters<typeof hashKanbanPayload>[0];
 it("l'empreinte est déterministe pour une même photographie",()=>{
  assert.equal(hashKanbanPayload(payload),hashKanbanPayload(structuredClone(payload)));
 });
 it("la modification d'une métrique change l'empreinte",()=>{
  const changed=structuredClone(payload);
  (changed.data.flow as {started:number}).started=1;
  assert.notEqual(hashKanbanPayload(payload),hashKanbanPayload(changed));
 });
 it("la sélection de rubriques élimine les données non Kanban",()=>{
  assert.deepEqual(selectKanbanReportSections(["flow","storyPoints","capacity"]),["flow","capacity"]);
 });
});
