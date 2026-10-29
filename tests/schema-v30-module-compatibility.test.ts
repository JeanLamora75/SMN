import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Liens : les opérations autorisées acceptent le schéma 29 à 32",()=>{
 for(const file of ["admin-transfer.ts","admin.ts","catalog.ts","categories-admin.ts"]){
  const sql=source("src/server/links/"+file);
  assert.match(sql,/i\.schema_version BETWEEN 29 AND 32/,file);
  assert.doesNotMatch(sql,/i\.schema_version=29\b/,file);
 }
});
test("Centre Rapports et archives : la lecture reste bornée à l'équipe jusqu'en v32",()=>{
 const page=source("src/app/app/reports/page.tsx");
 const archive=source("src/server/reports/archive-library.ts");
 assert.match(page,/evaluateSchemaCapability\(schema,"multi-team"\)\.ok/);
 assert.match(archive,/i\.schema_version BETWEEN 28 AND 32/);
 assert.match(archive,/WHERE a\.team_id=\$1/);
});
test("Capacité réelle : lecture v31 contextualisée, écriture historique encore interdite",()=>{
 const route=source("src/app/api/admin/capacity-actual/route.ts");
 assert.match(route,/if\(\[28,29,30,31,32\]\.includes\(v\.rows\[0\]\?\.schema_version\?\?0\)\)/);
 assert.match(route,/resolveAdminTeam\(db,/);
 assert.match(route,/if\(\(version\.rows\[0\]\?\.schema_version\?\?0\)>=28\)/);
});
