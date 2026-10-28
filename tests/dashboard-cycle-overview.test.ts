import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import CycleOverview from "../src/app/app/cycle-overview";
import type {DashboardContext} from "../src/server/dashboard/read";

const contexts:Record<"scrum"|"kanban",DashboardContext>={
  scrum:{productId:"product-1",product:"Produit pilote",teamId:"team-1",team:"Équipe Alpha",mode:"scrum"},
  kanban:{productId:"product-1",product:"Service pilote",teamId:"team-1",team:"Équipe Ops",mode:"kanban"},
};
const view=(mode:"scrum"|"kanban",locale:"fr"|"en")=>
  renderToStaticMarkup(createElement(CycleOverview,{
    context:contexts[mode],locale,teamHref:"/app/team/team-1?returnTo=%2Fapp",cycle:null,
  }));

describe("SMN-21 — cockpit UX lot 2, état sans cycle",()=>{
  it("affiche un seul titre de cycle neutre et les vrais contextes Scrum/Kanban",()=>{
    const scrum=view("scrum","fr");
    const kanban=view("kanban","fr");
    assert.match(scrum,/Aucun cycle créé/);
    assert.match(scrum,/Équipe Alpha/);
    assert.match(scrum,/Produit pilote/);
    assert.match(scrum,/Produit pilote/);
    assert.match(scrum,/Sprint/);
    assert.match(kanban,/Période Kanban/);
    assert.match(kanban,/Équipe Ops/);
    assert.equal((scrum.match(/<h1\b/g)||[]).length,1);
    assert.match(scrum,/href="\/app\/team\/team-1\?returnTo=%2Fapp"/);
  });
  it("présente cinq cartes, dont les deux notes de Sprint, et les unités existantes",()=>{
    const html=view("scrum","fr");
    assert.equal((html.match(/class="smn-metric-card/g)||[]).length,5);
    for(const label of ["Capacité prévue","Capacité réelle","SP initialement engagés",
      "SP réalisés","Tickets initialement engagés","Tickets réalisés",
      "Jours ouvrés restants","Confiance de l’équipe","Clarté des objectifs","J/H","SP"]){
      assert.ok(html.includes(label),label);
    }
    assert.doesNotMatch(html,/Avancement global|Productivité|\b0\s*(?:SP|J\/H|tickets)\b/i);
    assert.match(html,/Non renseigné/);
    assert.match(html,/Aucun cycle précédent/);
  });
  it("n'invente ni dates, ni objectifs, ni comparaison en l'absence de producteurs",()=>{
    const html=view("scrum","fr");
    assert.match(html,/Objectif/);
    assert.match(html,/Non renseigné/);
    assert.doesNotMatch(html,/smn-cycle-date-range/);
    assert.doesNotMatch(html,/20\d\d-\d\d-\d\d|\b\d+\s*jours ouvrés restants\b/);
    assert.doesNotMatch(html,/href="\/app\/cycles/);
  });
  it("affiche le Sprint sélectionné, son état temporel et ses dates, sans inventer de KPI",()=>{
    const html=renderToStaticMarkup(createElement(CycleOverview,{
      context:contexts.scrum,locale:"fr",teamHref:"/app/team/team-1",
      cycle:{id:"sprint-1",name:"Sprint de novembre",status:"planned",
        suspended:false,startAt:"2026-11-09T08:00:00Z",
        endAt:"2026-11-22T22:59:00Z",timeZone:"Europe/Paris"}
    }));
    assert.match(html,/Sprint de novembre/);
    assert.match(html,/9 nov\. 2026/);
    assert.match(html,/22 nov\. 2026/);
    assert.doesNotMatch(html,/Aucun cycle créé/);
    assert.match(html,/Source non encore raccordée/);
  });
  it("traduit tout le cockpit en anglais et conserve une vraie fiche d'équipe",()=>{
    const html=view("kanban","en");
    for(const s of ["No cycle created","Kanban period","Planned capacity",
      "Actual capacity","Initially committed story points","Working days remaining",
      "No previous cycle","Not specified"]){
      assert.ok(html.includes(s),s);
    }
    assert.match(html,/href="\/app\/team\/team-1\?returnTo=%2Fapp"/);
    assert.doesNotMatch(html,/Aucun cycle créé|Capacité prévue/);
  });
});
