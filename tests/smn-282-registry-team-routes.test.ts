import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const protectedId=[
 "action-links","assessment","comments","create-action","cycles",
 "decision","history","journal","linked","materialize","parties",
 "relation-candidates","relations","roam","vigilance"
];
const protectedOther=[
 "automatic-highlights","confirmed-highlights","deadlines","fact-selection"
];

test("Sous-routes historiques des registres : chaque lecture/écriture passe par le verrou v27",()=>{
 for(const name of protectedId){
  const file="src/app/api/admin/registries/[id]/"+name+"/route.ts";
  const code=source(file);
  assert.match(code,/withLegacyRegistryReadDb\(|withLegacyTeamApi\(|await assertLegacyTeamApi\(db\)/,file);
  if(code.includes("withAuthDb("))assert.match(code,/await assertLegacyTeamApi\(db\)/,file);
 }
 for(const name of protectedOther){
  const file="src/app/api/admin/registries/"+name+"/route.ts";
  const code=source(file);
  assert.doesNotMatch(code,/withAuthDb\(|withSprintIndexDb\(/,file);
  assert.match(code,/withLegacyRegistryReadDb\(|withLegacyTeamApi\(/,file);
 }
 const confirmed=source("src/app/api/admin/registries/confirmed-highlights/[id]/route.ts");
 assert.match(confirmed,/withLegacyTeamApi\(/);
});
test("Le wrapper en lecture seule vérifie le schéma avant l'accès aux données",()=>{
 const code=source("src/server/registries/legacy-read.ts");
 assert.match(code,/await assertLegacyTeamApi\(db\)/);
 assert.match(code,/return read\(db\)/);
 assert.ok(code.indexOf("await assertLegacyTeamApi(db)")<code.indexOf("return read(db)"));
});
test("API liste, cycles et attention : résolution sécurisée du teamId de v28",()=>{
 for(const file of [
  "src/app/api/admin/registries/route.ts",
  "src/app/api/admin/registries/cycles/route.ts",
  "src/app/api/admin/registries/attention/route.ts"
 ]){
  assert.match(source(file),/resolveRegistryReadContext\(db/,file);
 }
 assert.match(source("src/app/api/admin/registries/route.ts"),
  /await assertLegacyTeamApi\(db\)/);
});
test("Détail : la nouvelle lecture n'expose aucun historique par ID seul",()=>{
 const route=source("src/app/api/admin/registries/[id]/route.ts");
 const service=source("src/server/registries/team-item-read.ts");
 assert.match(route,/readTeamRegistryItem\(db/);
 assert.match(route,/await assertLegacyTeamApi\(db\)/);
 assert.match(service,/r.id=\$1 AND r.team_id=\$2/);
 assert.doesNotMatch(service,/smn_registry_item_audit|smn_registry_relation/);
});
test("UI v28 : pas d'édition et équipe transmise aux fetch et à l'URL",()=>{
 const page=source("src/app/app/admin/registries/page.tsx");
 const detail=source("src/app/app/admin/registries/[id]/page.tsx");
 const list=source("src/app/app/admin/registries/registry-list.tsx");
 assert.match(page,/canManage:actor\.role==="admin"&&/);
 assert.match(page,/<RegistryList key=\{teamId\}/);
 assert.match(detail,/context\?\.version===28/);
 assert.match(detail,/readTeamRegistryItem\(db/);
 assert.match(detail,/if\(context\?\.version===28\)/);
 assert.match(detail,/context\.item/);
 assert.match(list,/teamId,type,search:query\.search/);
 assert.match(list,/new URLSearchParams\(\{teamId\}\)/);
 assert.match(list,/type,\.\.\.query,page,view,teamId/);
});
