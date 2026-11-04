import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {initialTeamFilters,filterTeamMembers,splitTeamMembersByAssignment}
 from "../src/app/app/admin/members/team-cockpit-filter";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const today="2026-11-03";
const fixtures=[
 {id:"a",displayName:"A",startOn:"2026-01-01",endOn:null,archived:false,isProvisional:false},
 {id:"b",displayName:"B",startOn:"2026-11-01",endOn:"2026-11-03",archived:false,isProvisional:false},
 {id:"c",displayName:"C",startOn:"2026-05-01",endOn:"2026-07-31",archived:false,isProvisional:false},
 {id:"d",displayName:"D",startOn:"2026-04-01",endOn:"2026-10-01",archived:false,isProvisional:false},
 {id:"e",displayName:"E",startOn:"2026-10-20",endOn:null,archived:false,isProvisional:false},
 {id:"f",displayName:"F",startOn:"2026-01-01",endOn:"2026-10-01",archived:true,isProvisional:false}
];

test("deux groupes triés : entrées décroissantes, puis départs décroissants",()=>{
 const result=splitTeamMembersByAssignment(fixtures,today);
 assert.deepEqual(result.active.map(m=>m.id),["b","e","a"]);
 assert.deepEqual(result.inactive.map(m=>m.id),["d","f","c"]);
});
test("date de fin inclusive : départ le jour courant actif, inactif le lendemain",()=>{
 const same=splitTeamMembersByAssignment(fixtures,"2026-11-03");
 assert.ok(same.active.some(m=>m.id==="b"));
 const next=splitTeamMembersByAssignment(fixtures,"2026-11-04");
 assert.ok(next.inactive.some(m=>m.id==="b"));
 assert.ok(!next.active.some(m=>m.id==="b"));
});
test("les filtres par défaut ne cachent pas les anciens membres",()=>{
 assert.equal(initialTeamFilters.status,"all");
 const filtered=filterTeamMembers(fixtures,initialTeamFilters);
 assert.equal(filtered.length,6);
 assert.equal(splitTeamMembersByAssignment(filtered,today).inactive.length,3);
});
test("sélection d'affectation contextualisée, deux sections et dates en liste",()=>{
 const sql=read("src/server/members/quick-create.ts");
 const ui=read("src/app/app/admin/members/team-overview.tsx");
 const css=read("src/app/app/admin/members/team-cockpit.css");
 assert.match(sql,/WHERE a\.member_id=m\.id AND a\.team_id=\$1/);
 assert.match(sql,/ORDER BY a\.start_on DESC,a\.id DESC LIMIT 1/);
 assert.match(ui,/splitTeamMembersByAssignment\(members,today\)/);
 assert.match(ui,/items:grouped\.active/);
 assert.match(ui,/items:grouped\.inactive/);
 assert.match(ui,/t\("teamUX\.startDate"\)/);
 assert.match(ui,/t\("teamUX\.endDate"\)/);
 assert.match(ui,/t\("teamUX\.workedDays"\)/);
 assert.match(ui,/format\(member\.workedDays\)/);
 assert.match(ui,/t\("teamUX\.inactiveAssignmentStatus"\)/);
 assert.match(ui,/t\("teamUX\.nonArchivedMembers"\)/);
 assert.match(ui,/dateLabel\(member\.startOn\)/);
 assert.match(ui,/dateLabel\(member\.endOn\)/);
 assert.match(css,/smn-team-member-sections/);
 assert.match(css,/smn-team-members-heading/);
});
test("traductions FR et EN synchronisées",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).teamUX;
 const en=JSON.parse(read("src/i18n/en.json")).teamUX;
 for(const key of ["activeAssignmentHeading","inactiveAssignmentHeading","startDate","endDate",
  "inactiveAssignmentStatus","nonArchivedMembers","workedDays"]){
  assert.ok(fr[key]);assert.ok(en[key]);
 }
});

test("vue Liste : jours travaillés proviennent du calcul groupé de l'équipe",()=>{
 const source=read("src/app/api/admin/members/route.ts");
 assert.match(source,/readTeamAnnualWorkedForRoster\(db,team\.team_id/);
 assert.match(source,/enriched\.members\.map\(member=>member\.id\)/);
 assert.match(source,/workedDays:worked===null\?null:\(worked\.get\(member\.id\)\?\?0\)\/2/);
 assert.match(source,/try\{[\s\S]*?readTeamAnnualWorkedForRoster/);
 assert.match(source,/catch\(error\)\{/);
 const ui=read("src/app/app/admin/members/team-overview.tsx");
 assert.match(ui,/typeof member\.workedDays==="number"/);
 assert.match(ui,/maximumFractionDigits:1/);
});
