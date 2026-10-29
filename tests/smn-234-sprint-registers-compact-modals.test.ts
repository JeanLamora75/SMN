import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import SprintRegisterRow from "../src/app/app/admin/sprints/[sprintId]/sprint-register-row";
import type {RegisterKind,SprintRegister} from "../src/lib/sprint-registers";
import {registerKinds} from "../src/lib/sprint-registers";

const id="123e4567-e89b-42d3-a456-426614174003";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const fixture=(kind:RegisterKind,href:string|null="/app/admin/registries/"+id):SprintRegister=>({
 id,kind,title:"Titre sans soulignement",status:kind==="highlight"?null:"open",
 priority:kind==="risk"?"medium":null,date:"2026-10-24T00:00:00.000Z",
 openedAt:kind==="decision"||kind==="highlight"?null:"2026-10-24T00:00:00.000Z",
 closedAt:null,teamIds:["team-1"],sprintIds:["sprint-1"],href
});
const render=(kind:RegisterKind,opts:{manage?:boolean;historical?:boolean;href?:string|null}={})=>
 renderToStaticMarkup(createElement(SprintRegisterRow,{
  item:fixture(kind,opts.href===undefined?undefined:opts.href),
  teamId:"team-1",canManage:opts.manage??true,historical:opts.historical??false,
  typeLabel:"Risques",statusLabel:kind==="highlight"?null:"Ouvert",
  priorityLabel:kind==="risk"?"Priorité : Moyenne":null,
  dateLabel:"Date métier",formattedDate:"24 oct. 2026"
 }));

describe("SMN-234 — Registres compacts et modales de l'onglet Sprint",()=>{
 it("statut avant titre, priorité, date et crayon sur la même ligne",()=>{
  const html=render("risk");
  const positions=["smn-sprint-register-status","smn-sprint-register-title",
   "smn-sprint-register-priority","smn-sprint-register-date","smn-sprint-register-action"];
  let previous=-1;
  for(const klass of positions){
   const current=html.indexOf('class="'+klass);
   assert.ok(current>previous,klass+" doit suivre la précédente information");
   previous=current;
  }
  assert.match(html,/Ouvert/);
  assert.match(html,/Titre sans soulignement/);
  assert.match(html,/Priorité : Moyenne/);
  assert.match(html,/24 oct\. 2026/);
  assert.equal((html.match(/aria-haspopup="dialog"/g)??[]).length,2);
  assert.match(html,/bi-pencil-square/);
  assert.doesNotMatch(html,/>Ouvrir la fiche</);
  assert.doesNotMatch(html,/<dialog/);
 });
 it("chaque catégorie conserve son icône et son indicateur pleine hauteur",()=>{
  const icons=["exclamation-octagon-fill","exclamation-triangle-fill","stack",
   "bullseye","ticket-perforated-fill","bell-fill"];
  for(let i=0;i<registerKinds.length;i++){
   const html=render(registerKinds[i]);
   assert.match(html,new RegExp("bi-"+icons[i]));
   assert.match(html,new RegExp("smn-sprint-register-icon-"+registerKinds[i]));
  }
 });
 it("profil en lecture seule : titre consultable, aucun crayon",()=>{
  const html=render("risk",{manage:false});
  assert.equal((html.match(/aria-haspopup="dialog"/g)??[]).length,1);
  assert.doesNotMatch(html,/bi-pencil-square/);
 });
 it("snapshot figé : aucune édition même avec des droits admin",()=>{
  const html=render("risk",{historical:true});
  assert.equal((html.match(/aria-haspopup="dialog"/g)??[]).length,1);
  assert.doesNotMatch(html,/bi-pencil-square/);
 });
 it("fait automatique sans fiche éditable : consultation mais aucun faux formulaire",()=>{
  const html=render("highlight",{href:null});
  assert.match(html,/Titre sans soulignement/);
  assert.equal((html.match(/aria-haspopup="dialog"/g)??[]).length,1);
  assert.doesNotMatch(html,/bi-pencil-square/);
 });
 it("le formulaire réel réutilise RegistryCreate et rafraîchit après sauvegarde",()=>{
  const row=read("src/app/app/admin/sprints/[sprintId]/sprint-register-row.tsx");
  assert.match(row,/RegistryCreate itemId=\{itemId\}/);
  assert.match(row,/modalMode onSaved=\{onSaved\}/);
  assert.match(row,/router\.refresh\(\)/);
  assert.match(row,/onClose=\{\(\)=>setOpened\(false\)\}/);
  assert.match(row,/safeRegisterHref\(item.href\)/);
  assert.match(row,/href===recordHref/);
 });
 it("tous les sous-formulaires signalent leur sauvegarde avant fermeture",()=>{
  const registry=read("src/app/app/admin/registries/registry-create.tsx");
  const components={
   "decision-detail":"DecisionDetail",
   "decision-actions":"DecisionActions",
   "action-links":"ActionLinks",
   "dependency-parties":"DependencyParties",
   "dependency-vigilance":"DependencyVigilance",
   "materialize-risk":"MaterializeRisk",
   "risk-assessment":"RiskAssessment",
   "risk-roam":"RiskRoam",
   "registry-cycles":"RegistryCycles",
   "registry-relations":"RegistryRelations"
  };
  for(const [file,name] of Object.entries(components)){
   const code=read("src/app/app/admin/registries/"+file+".tsx");
   assert.ok(registry.includes("<"+name),name+" doit rester accessible");
   assert.match(code,/onSaved\?\.\(\)/);
   assert.match(registry,new RegExp("<"+name+"[^>]+onSaved=\\{onSaved\\}"));
  }
 });
 it("le responsive garde une ligne desktop et des retours adaptés sur tablette/mobile",()=>{
  const css=read("src/app/dashboard.css");
  assert.match(css,/grid-template-areas:"kind status title priority date action"/);
  assert.match(css,/\.smn-sprint-register-icon svg \{width:23px;height:23px;\}/);
  assert.match(css,/\.smn-sprint-register-title:hover,[\s\S]+?text-decoration:none/);
  assert.match(css,/\.smn-sprint-register-filters \.badge svg \{width:17px;height:17px/);
  assert.match(css,/@media\(max-width:1100px\)/);
  assert.match(css,/@media\(max-width:680px\)/);
 });
 it("le parent conserve filtres, pagination, rôle et Sprint courant",()=>{
  const panel=read("src/app/app/admin/sprints/[sprintId]/sprint-registers-panel.tsx");
  const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
  for(const m of ["registerKinds.map","url(data.page-1)","url(data.page+1)",
   "<SprintRegisterRow","teamId={teamId}","historical={data.source"])assert.ok(panel.includes(m),m);
  assert.match(page,/canManage=\{canManage&&cycle\.status!=="closed"\} selectedKind=\{registerKind\}/);
 });
});
