import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {presenceFromCapacity,presenceFromSnapshot} from "../src/lib/sprint-presence";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("la localisation historique du membre alimente le drapeau affiché",()=>{
 const metadata=read("src/server/sprints/presence-metadata-read.ts");
 const table=read("src/app/app/admin/sprints/[sprintId]/sprint-capacity-member-table.tsx");
 assert.match(metadata,/loc\.member_id=m\.id AND loc\.effective_from<=\$4::date/);
 assert.match(metadata,/ORDER BY loc\.effective_from DESC,loc\.revision DESC LIMIT 1/);
 assert.match(metadata,/countryIso2:found\[0\]\?\.country_iso2\?\?null/);
 assert.match(table,/<CountryFlag countryIso2=\{member\.countryIso2\} tableSize\/>/);
});

test("les anciens snapshots sans pays restent lisibles, les nouveaux préservent ISO2",()=>{
 const source=presenceFromCapacity({hoursPerJh:7,members:[{
  memberId:"m1",displayName:"A",totalJh:1,
  days:[{date:"2026-11-18",status:"calculated",availableHalfDays:2,absenceItems:[]}]
 }]});
 const old=presenceFromSnapshot(source,1);
 assert.equal(old.state,"available");
 if(old.state==="available")assert.equal(old.members[0].countryIso2,undefined);
 const fresh=presenceFromSnapshot({...source,members:source.members.map(member=>({...member,countryIso2:"FR"}))},2);
 assert.equal(fresh.state,"available");
 if(fresh.state==="available")assert.equal(fresh.members[0].countryIso2,"FR");
 const invalid=presenceFromSnapshot({...source,members:source.members.map(member=>({...member,countryIso2:"FRA"}))},2);
 assert.equal(invalid.state,"unavailable");
});

test("le tri manuel et les informations nominatives restent confinés à la table protégée",()=>{
 const panel=read("src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx");
 const sorter=read("src/app/app/admin/sprints/[sprintId]/sprint-capacity-sort.ts");
 assert.match(panel,/if\(!canViewNames\)return/);
 assert.match(sorter,/if\(!sort\)/);
 assert.match(sorter,/roles\.includes\("scrumMaster"\)\?0:roles\.includes\("productOwner"\)\?1/);
});
