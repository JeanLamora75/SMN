import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const load=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("les trois accès équipes utilisent le contrat commun",()=>{
 for(const path of ["src/server/teams/resolve.ts","src/server/teams/write.ts","src/app/api/admin/teams/route.ts"]){
  const source=load(path);
  assert.match(source,/evaluateSchemaCapability/);
  assert.equal(source.includes("[28,29,30,31,32].includes"),false);
 }
});

test("le calendrier multiéquipes utilise le contrat commun",()=>{
 const source=load("src/app/api/team-calendar/time-zones/route.ts");
 assert.match(source,/evaluateSchemaCapability\(schema,"multi-team"\)/);
 assert.match(source,/resolveAdminTeam/);
 assert.equal(source.includes("schema<=32"),false);
});
