import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {PresenceMember} from "../src/lib/sprint-presence";
import {nextCapacitySort,sortCapacityMembers} from "../src/app/app/admin/sprints/[sprintId]/sprint-capacity-sort";

const members:PresenceMember[]=[
 {memberId:"a",displayName:"Zoe",agileRoles:["developer"],professionalFunction:"Développeur",
  contributionPercents:[100],presenceJh:10,absenceJh:0,developmentJh:8,unknownDays:0,daysCount:10},
 {memberId:"b",displayName:"Alice",agileRoles:["productOwner"],professionalFunction:"Business Analyst",
  contributionPercents:[50],presenceJh:5,absenceJh:2,developmentJh:0,unknownDays:0,daysCount:10},
 {memberId:"c",displayName:"Marc",agileRoles:["scrumMaster"],professionalFunction:"Consultant",
  contributionPercents:[75],presenceJh:null,developmentJh:null,unknownDays:3,daysCount:10}
];
const names=(x:readonly PresenceMember[])=>x.map(m=>m.displayName);
test("deux clics inversent le sens et une nouvelle colonne recommence décroissant",()=>{
 const first=nextCapacitySort(null,"presence");
 assert.deepEqual(first,{key:"presence",direction:"desc"});
 assert.deepEqual(nextCapacitySort(first,"presence"),{key:"presence",direction:"asc"});
 assert.deepEqual(nextCapacitySort(first,"function"),{key:"function",direction:"desc"});
});
test("par défaut : Scrum Master, Product Owner, Développeur, puis noms alphabétiques",()=>{
 const input:PresenceMember[]=[
  members[0],members[1],members[2],
  {...members[0],memberId:"d",displayName:"Aaron",agileRoles:["developer"]},
  {...members[1],memberId:"e",displayName:"Béatrice",agileRoles:["productOwner"]},
  {...members[0],memberId:"f",displayName:"Double rôle",agileRoles:["scrumMaster","developer"]}
 ];
 assert.deepEqual(names(sortCapacityMembers(input,null)),
  ["Double rôle","Marc","Alice","Béatrice","Aaron","Zoe"]);
 assert.deepEqual(names(input),["Zoe","Alice","Marc","Aaron","Béatrice","Double rôle"]);
});
test("les J/H sont triés numériquement et les valeurs manquantes restent à la fin",()=>{
 assert.deepEqual(names(sortCapacityMembers(members,{key:"presence",direction:"desc"})),["Zoe","Alice","Marc"]);
 assert.deepEqual(names(sortCapacityMembers(members,{key:"presence",direction:"asc"})),["Alice","Zoe","Marc"]);
 assert.deepEqual(names(sortCapacityMembers(members,{key:"absence",direction:"desc"})),["Alice","Zoe","Marc"]);
 assert.deepEqual(names(sortCapacityMembers(members,{key:"development",direction:"asc"})),["Alice","Zoe","Marc"]);
});
test("les pourcentages, libellés et données de fiabilité sont triables",()=>{
 assert.deepEqual(names(sortCapacityMembers(members,{key:"contribution",direction:"desc"})),["Zoe","Marc","Alice"]);
 assert.deepEqual(names(sortCapacityMembers(members,{key:"name",direction:"asc"})),["Alice","Marc","Zoe"]);
 assert.deepEqual(names(sortCapacityMembers(members,{key:"function",direction:"asc"})),["Alice","Marc","Zoe"]);
 assert.deepEqual(names(sortCapacityMembers(members,{key:"quality",direction:"desc"}))[0],"Marc");
});
test("les en-têtes sont tous interactifs avec un aria-sort et une flèche avant leur texte",()=>{
 const source=readFileSync(new URL("../src/app/app/admin/sprints/[sprintId]/sprint-capacity-member-table.tsx",import.meta.url),"utf8");
 const panel=readFileSync(new URL("../src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx",import.meta.url),"utf8");
 for(const key of ["name","roles","function","contribution","presence","absence","development","quality"]){
  assert.ok(source.includes('heading("'+key+'",'),key);
 }
 assert.match(source,/aria-sort=\{sort\?\.key===key/);
 assert.match(source,/smn-capacity-sort-arrow/);
 assert.match(source,/nextCapacitySort\(previous,key\)/);
 assert.match(panel,/SprintCapacityMemberTable members=\{data\.members\}/);
});
