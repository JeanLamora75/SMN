import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {filterTeamMembers,availableFunctions,initialTeamFilters}
 from "../src/app/app/admin/members/team-cockpit-filter";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const members=[
 {displayName:"Élodie A.",professionalFunction:"Consultante",archived:false,isProvisional:false,
  roleShares:{scrumMaster:60,productOwner:0,developer:40}},
 {displayName:"Mina B.",professionalFunction:"Lead Tech",archived:false,isProvisional:true,
  roleShares:{scrumMaster:0,productOwner:0,developer:100}},
 {displayName:"Teddy C.",professionalFunction:"Lead Tech",archived:true,isProvisional:false,
  roleShares:{scrumMaster:0,productOwner:100,developer:0}}
];
test("filtres Equipe : actifs par defaut et pas de donnees inventees",()=>{
 assert.deepEqual(filterTeamMembers(members,initialTeamFilters).map(x=>x.displayName),["Élodie A.","Mina B."]);
 assert.deepEqual(availableFunctions(members),["Consultante","Lead Tech"]);
});
test("recherche texte insensible aux accents/casse et filtre fonction",()=>{
 assert.equal(filterTeamMembers(members,{...initialTeamFilters,search:"ELODIE"})[0]?.displayName,"Élodie A.");
 assert.equal(filterTeamMembers(members,{...initialTeamFilters,search:"TECH"}).length,1);
 assert.equal(filterTeamMembers(members,{...initialTeamFilters,functionName:"Lead Tech"}).length,1);
});
test("filtre roles : une personne peut avoir plusieurs roles",()=>{
 assert.equal(filterTeamMembers(members,{...initialTeamFilters,role:"sm"}).length,1);
 assert.equal(filterTeamMembers(members,{...initialTeamFilters,role:"dev"}).length,2);
 assert.equal(filterTeamMembers(members,{...initialTeamFilters,role:"po"}).length,0);
});
test("statuts : archives/provisoires seulement si accessibles dans le roster",()=>{
 assert.deepEqual(filterTeamMembers(members,{...initialTeamFilters,status:"archived"}).map(x=>x.displayName),["Teddy C."]);
 assert.deepEqual(filterTeamMembers(members,{...initialTeamFilters,status:"provisional"}).map(x=>x.displayName),["Mina B."]);
 assert.equal(filterTeamMembers(members,{...initialTeamFilters,status:"all"}).length,3);
});
test("hero, filtres, fiches et CSS restent bornes a la page Equipe",()=>{
 const ui=read("src/app/app/admin/members/team-overview.tsx");
 const css=read("src/app/app/admin/members/team-cockpit.css");
 const page=read("src/app/app/admin/members/page.tsx");
 assert.match(page,/import "\.\/team-cockpit\.css"/);
 assert.match(ui,/smn-team-cockpit/);
 assert.match(ui,/smn-team-hero/);
 assert.match(ui,/teamUX\.contextVision/);
 assert.match(ui,/teamUX\.contextGoalHeading/);
 assert.match(ui,/filterTeamMembers/);
 assert.match(ui,/smn-team-filter-panel/);
 assert.match(ui,/smn-team-member-grid/);
 assert.match(ui,/TeamContextEditor/);
 assert.match(ui,/createOne\(e\)/);
 assert.match(ui,/teamUX\.openMember/);
 assert.match(css,/\.smn-team-cockpit \.smn-team-hero/);
 assert.doesNotMatch(css,/\.smn-registry-cockpit/);
});
test("contrats FR / EN et messages de la page",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).teamCockpit;
 const en=JSON.parse(read("src/i18n/en.json")).teamCockpit;
 assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
 for(const key of ["title","filtersHeading","searchLabel","roleLabel","functionLabel",
  "statusLabel","filterButton","resetButton","noResults","active","archived","provisional"]){
  assert.ok(fr[key]&&en[key],key);
 }
});
