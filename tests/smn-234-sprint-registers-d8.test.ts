import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {readFileSync} from "node:fs";
import {
 registerKinds,normalizeRegister,relevantToSprint,safeRegisterHref,
 selectSprintRegisterPage
} from "../src/lib/sprint-registers";
import {readSprintRegisters} from "../src/server/sprints/registers-detail-read";

const sprint={id:"123e4567-e89b-42d3-a456-426614174000",
 startAt:"2026-10-05T07:00:00Z",endAt:"2026-10-19T07:00:00Z"};
const row=(kind:string,id:string,attrs:Record<string,unknown>={})=>({
 kind,id,title:kind+"-"+id,status:kind==="highlight"?null:"open",
 priority:null,date:"2026-10-08T08:00:00Z",
 openedAt:"2026-10-01T08:00:00Z",closedAt:null,
 teamIds:["team-a"],sprintIds:[sprint.id],href:null,...attrs
});
const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function fake(handler:(sql:string,params?:readonly unknown[])=>{rows:unknown[]}){
 const queries:{sql:string;params?:readonly unknown[]}[]=[];
 const db={query:async(sql:string,params?:readonly unknown[])=>{
  queries.push({sql,params});
  assert.match(sql,/^\s*SELECT\b/);
  return handler(sql,params);
 }} as unknown as Client;
 return {db,queries};
}

describe("SMN-234 D8 — contrat pur de sélection",()=>{
 it("préserve exactement les six types, sans inventer de statut au fait marquant",()=>{
  assert.deepEqual(registerKinds,
   ["risk","obstacle","dependency","decision","action","highlight"]);
  assert.equal(normalizeRegister(row("highlight","f1"))?.status,null);
 });
 it("inclut un risque commencé avant et encore actif pendant le Sprint",()=>{
  const risk=normalizeRegister(row("risk","r1"))!;
  assert.equal(relevantToSprint(risk,"team-a",sprint),true);
 });
 it("inclut un obstacle résolu pendant le Sprint et exclut ceux résolus avant",()=>{
  const inside=normalizeRegister(row("obstacle","o1",{
   closedAt:"2026-10-09T12:00:00Z"}))!;
  const earlier=normalizeRegister(row("obstacle","o2",{
   closedAt:"2026-10-04T12:00:00Z"}))!;
  assert.equal(relevantToSprint(inside,"team-a",sprint),true);
  assert.equal(relevantToSprint(earlier,"team-a",sprint),false);
 });
 it("respecte les bornes inclusives/exclusives des faits ponctuels",()=>{
  const inside=normalizeRegister(row("decision","d1",{
   date:sprint.startAt}))!;
  const outside=normalizeRegister(row("decision","d2",{
   date:sprint.endAt}))!;
  assert.equal(relevantToSprint(inside,"team-a",sprint),true);
  assert.equal(relevantToSprint(outside,"team-a",sprint),false);
 });
 it("ne divulgue jamais les fiches associées uniquement à une autre équipe",()=>{
  const one=normalizeRegister(row("risk","r",{
   teamIds:["team-b"],sprintIds:[sprint.id]}))!;
  assert.equal(relevantToSprint(one,"team-a",sprint),false);
 });
 it("déduplique une fiche liée à plusieurs cycles sans supprimer son identité",()=>{
  const a=row("risk","risk-1",{sprintIds:[sprint.id]});
  const b=row("risk","risk-1",{sprintIds:["autre-sprint"]});
  const selected=selectSprintRegisterPage({
   availableKinds:[...registerKinds],records:[a,b]
  },"team-a",sprint);
  assert.equal(selected?.total,1);
  assert.equal(selected?.items[0].id,"risk-1");
  assert.equal(selected?.items[0].sprintIds.length,2);
 });
 it("rejette des doublons divergents au lieu de masquer des modifications",()=>{
  const a=row("risk","risk-1");
  assert.equal(selectSprintRegisterPage({
   availableKinds:[...registerKinds],records:[a,{...a,status:"closed"}]
  },"team-a",sprint),null);
 });
 it("trie par date et pagine 205 éléments sans plafond implicite",()=>{
  const records=Array.from({length:205},(_,i)=>
   row("highlight",String(i),{
    date:new Date(Date.parse(sprint.startAt)+i*60000).toISOString()
   }));
  const page=selectSprintRegisterPage({
   availableKinds:[...registerKinds],records:records.reverse()
  },"team-a",sprint,9);
  assert.equal(page?.total,205);
  assert.equal(page?.page,9);
  assert.equal(page?.pageCount,9);
  assert.equal(page?.items.length,5);
  assert.equal(page?.items[0].id,"200");
 });
 it("distingue une vraie liste vide d'un registre non installé",()=>{
  const result=selectSprintRegisterPage({
   availableKinds:[...registerKinds],records:[]
  },"team-a",sprint);
  assert.equal(result?.total,0);
  const partial=selectSprintRegisterPage({
   availableKinds:["risk"],records:[]
  },"team-a",sprint);
  assert.equal(partial?.missingKinds.length,5);
 });
 it("une source ne peut pas se déclarer absente et exposer des fiches",()=>{
  assert.equal(selectSprintRegisterPage({
   availableKinds:["risk"],records:[row("action","a1")]
  },"team-a",sprint),null);
  assert.equal(selectSprintRegisterPage({
   availableKinds:["risk","risk"],records:[]
  } as never,"team-a",sprint),null);
  assert.equal(normalizeRegister(row("risk","r1",{teamIds:[]})),null);
 });
 it("valide les liens sans inventer de fiche ni autoriser une URL externe",()=>{
  assert.equal(safeRegisterHref("https://example.org"),null);
  assert.equal(safeRegisterHref("//evil.example"),null);
  assert.equal(safeRegisterHref("/app/../admin"),null);
  assert.equal(safeRegisterHref("/app/something?id=2"),null);
  assert.equal(safeRegisterHref("/app/registers/risk/id"),"/app/registers/risk/id");
  assert.equal(normalizeRegister(row("risk","r",{
   href:"https://example.org"})),null);
 });
});

describe("SMN-234 D8 — sécurité et absence de producteur",()=>{
 it("refuse un Sprint hors équipe avant tout autre accès",async()=>{
  const f=fake(()=>({rows:[]}));
  assert.equal(await readSprintRegisters(f.db,"team-a",sprint,1),null);
  assert.equal(f.queries.length,1);
  assert.deepEqual(f.queries[0].params,[sprint.id,"team-a"]);
 });
 it("un Sprint courant sans producteur Epic 5 est indisponible, pas vide",async()=>{
  const f=fake(()=>({rows:[{status:"active"}]}));
  const value=await readSprintRegisters(f.db,"team-a",sprint,1);
  assert.deepEqual(value,{state:"unavailable",reason:"producer-not-installed"});
  assert.equal(f.queries.length,1);
 });
 it("une clôture historique sans rubrique qualitative reste indisponible",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:1,snapshot:{goals:[]}}]});
  assert.deepEqual(await readSprintRegisters(f.db,"team-a",sprint,1),
   {state:"unavailable",reason:"history-missing"});
  assert.ok(!f.queries.some(x=>x.sql.includes("qualitative_register")));
 });
 it("la projection d'un futur snapshot Vn n'utilise pas les tables courantes",async()=>{
  const f=fake(sql=>sql.includes("SELECT s.status")?{rows:[{status:"closed"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   {rows:[{version:2,snapshot:{
    qualitativeRegisters:{
     records:[row("risk","risk-1")],availableKinds:[...registerKinds]
    }
   }}]});
  const r=await readSprintRegisters(f.db,"team-a",sprint,1);
  assert.equal(r?.state,"available");
  if(r?.state==="available"){
   assert.equal(r.total,1);
   assert.equal(r.source,"closure-snapshot");
   assert.equal(r.snapshotVersion,2);
  }
 });
 it("le composant possède une vraie liste, et l'indisponibilité sans chiffres fictifs",()=>{
  const page=file("src/app/app/admin/sprints/[sprintId]/page.tsx");
  const ui=file("src/app/app/admin/sprints/[sprintId]/sprint-registers-panel.tsx");
  assert.match(page,/active==="registers"\?await readSprintRegisters/);
  assert.match(ui,/missingKinds/);
  assert.match(ui,/registersProducerPending/);
  assert.match(ui,/registersNoRecords/);
  assert.doesNotMatch(ui,/pencil-square/);
 });
});
