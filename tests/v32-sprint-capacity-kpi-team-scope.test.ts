import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const kpis=read("src/server/sprints/sprint-capacity-kpis.ts");
const actual=read("src/server/capacity/actual.ts");
const engine=read("src/server/capacity/engine.ts");

test("C01 : capacité prévisionnelle v32 explicitement bornée à l'équipe du Sprint",()=>{
 assert.match(kpis,/readDevelopmentCapacity\(db,start,end,\{externalTransaction:true,teamId\}\)/);
 assert.match(kpis,/report\.team\.id!==teamId/);
 assert.match(engine,/i\.schema_version BETWEEN 28 AND 32/);
});
test("C02 : capacité réelle v32 et calcul imbriqué restent dans la même équipe",()=>{
 assert.match(kpis,/readActualCapacity\(db,start,end,readDevelopmentCapacity,\s*\{externalTransaction:true,teamId\}\)/);
 assert.match(actual,/i\.schema_version BETWEEN 28 AND 32/);
 assert.match(actual,/to_jsonb\(t\)->>'agile_mode'/);
 assert.match(actual,/to_jsonb\(t\)->>'is_archived'/);
 assert.match(actual,/teamId:options\.teamId/);
 assert.match(actual,/report\.team\.id!==teamId/);
});
test("Indicateurs : une valeur saisie reste distincte de la valeur calculée",()=>{
 assert.match(kpis,/selectCapacityKpis\(stored\?\.planned_jh\?\?legacyPlanned,stored\?\.actual_jh\?\?legacyActual,/);
 assert.match(kpis,/ROLLBACK TO SAVEPOINT/);
 assert.match(kpis,/calculatedPlanned,calculatedActual/);
});
