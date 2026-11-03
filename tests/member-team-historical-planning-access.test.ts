import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("le contrôle de portée conserve le mode actif par défaut et autorise explicitement l'historique",()=>{
 const scope=read("src/server/members/team-scope.ts");
 assert.match(scope,/options\?:Readonly<\{allowHistoricalAssignment\?:boolean\}>/);
 assert.match(scope,/options\?\.allowHistoricalAssignment===true/);
 assert.match(scope,/\$3::boolean OR \(a\.start_on<=CURRENT_DATE/);
 assert.match(scope,/SELECT DISTINCT a\.member_id FROM public\.smn_member_assignment a/);
 assert.match(scope,/a\.member_id=\$1 AND a\.team_id=\$2/);
 assert.match(scope,/m\.installation_id=t\.installation_id/);
});

test("localisation : consultation et modification de l'ancien membre dans la même équipe",()=>{
 const route=read("src/app/api/admin/members/[id]/team-location/route.ts");
 assert.equal((route.match(/allowHistoricalAssignment:true/g)??[]).length,2);
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(route,/parseLocationChange/);
 assert.match(route,/latest\?\.revision\?\?0/);
});

test("calendrier de travail : même périmètre historique et droits conservés",()=>{
 const route=read("src/app/api/admin/members/[id]/team-calendar/route.ts");
 assert.equal((route.match(/allowHistoricalAssignment:true/g)??[]).length,2);
 assert.match(route,/actor\.role!=="admin"/);
 assert.match(route,/parseCalendarWrite/);
 assert.match(route,/latest\?\.revision\?\?0/);
});

test("les autres lecteurs ne reçoivent aucune autorisation historique implicite",()=>{
 const route=read("src/app/api/admin/members/[id]/team-absence/route.ts");
 assert.doesNotMatch(route,/allowHistoricalAssignment:true/);
});
