import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import IndicatorSettingsTabs from "../src/app/app/admin/settings/indicators/settings-tabs";
import ExpressionGuide from "../src/app/app/admin/settings/indicators/expression-guide";
import RecommendedIndicatorGuide from "../src/app/app/admin/settings/indicators/recommended-guide";
import {recommendedForMode} from "../src/lib/indicators/recommended-catalog";

const source=(path:string)=>readFileSync(path,"utf8");
test("Le Cockpit Agile est isolé à la page d'administration des indicateurs",()=>{
 const page=source("src/app/app/admin/settings/indicators/page.tsx");
 const css=source("src/app/app/admin/settings/indicators/indicator-settings-cockpit.css");
 assert.match(page,/account\.role!=="admin"/);
 assert.match(page,/smn-sprint-detail-hero/);
 assert.match(page,/indicator-settings-cockpit\.css/);
 assert.match(css,/smn-indicator-settings-cockpit/);
 assert.match(css,/smn-indicator-global-cards/);
 assert.match(css,/data-indicator-view="list"/);
 assert.match(css,/data-indicator-view="cards"/);
});
test("Les trois onglets proposent les vues Cartes/Liste et conservent la navigation",()=>{
 const html=renderToStaticMarkup(createElement(IndicatorSettingsTabs,{
  catalogue:createElement("div",null,"Catalogue test"),permissions:createElement("div",null,"Permissions test"),
  teams:[],teamId:null
 }));
 assert.match(html,/Catalogue/);
 assert.match(html,/Guide des expressions/);
 assert.match(html,/Indicateurs recommandés/);
 assert.match(html,/>Cartes<\/button>/);
 assert.match(html,/>Liste<\/button>/);
 assert.match(html,/aria-label="Mode d’affichage"/);
 assert.match(source("src/app/app/admin/settings/indicators/settings-tabs.tsx"),/localStorage\.setItem\(VIEW_KEY/);
});
test("Guide des expressions : rendu cartes et liste avec action Copier",()=>{
 for(const view of ["cards","list"] as const){
  const html=renderToStaticMarkup(createElement(ExpressionGuide,{view}));
  assert.match(html,/Guide des expressions/);
  assert.match(html,/Copier/);
  if(view==="list")assert.match(html,/<table/);
  else assert.match(html,/smn-indicator-guide-card/);
 }
});
test("Indicateurs recommandés : rendu cartes et liste Scrum / Kanban",()=>{
 assert.equal(recommendedForMode("scrum").length,24);
 assert.equal(recommendedForMode("kanban").length,17);
 for(const mode of ["scrum","kanban"] as const){
  for(const view of ["cards","list"] as const){
   const html=renderToStaticMarkup(createElement(RecommendedIndicatorGuide,{
    teams:[{id:"team1",name:"Equipe test",mode}],teamId:"team1",view
   }));
   assert.match(html,/Copier/);
   assert.match(html,new RegExp(mode==="scrum"?"24 indicateur":"17 indicateur"));
   if(view==="list"){assert.match(html,/<table/);assert.match(html,/Voir la fiche/);}
   else assert.match(html,/smn-indicator-guide-card/);
  }
 }
});
test("Le Catalogue conserve Modifier et Archiver dans les deux modes",()=>{
 const code=source("src/app/app/admin/indicators/catalog-client.tsx");
 assert.match(code,/smn-indicator-global-list/);
 assert.match(code,/smn-indicator-global-cards/);
 assert.equal((code.match(/t\("indicators\.archive"\)/g)??[]).length,2);
 assert.equal((code.match(/onClick=\{\(\)=>editor\(d\)\}/g)??[]).length,2);
});
