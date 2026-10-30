import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const engine=read("src/server/capacity/engine.ts");
const presence=read("src/server/sprints/presence-detail-read.ts");

test("v32 capacité Sprint : l'équipe est résolue par son mode et les versions 28 à 32",()=>{
 assert.match(engine,/i\.schema_version BETWEEN 28 AND 32/);
 assert.match(engine,/to_jsonb\(t\)->>'agile_mode'/);
 assert.match(engine,/to_jsonb\(i\)->>'mode'/);
 assert.match(engine,/to_jsonb\(t\)->>'is_archived'/);
 assert.doesNotMatch(engine,/schema_version IN \(28,29,30,31\)/);
});
test("v32 capacité Sprint : les fermetures entreprise restent applicables après v31",()=>{
 assert.match(engine,/const usesCompanyClosures=\(schema\?\.rows\[0\]\?\.schema_version\?\?0\)>=31/);
 assert.match(engine,/usesCompanyClosures\?db\.query<Closure>/);
});
test("v32 capacité Sprint : présence en lecture seule protégée par mode et archivage",()=>{
 assert.match(presence,/to_jsonb\(t\)->>'agile_mode'/);
 assert.match(presence,/to_jsonb\(i\)->>'mode'/);
 assert.match(presence,/to_jsonb\(t\)->>'is_archived'/);
 assert.match(presence,/SAVEPOINT smn_presence_detail/);
 assert.match(presence,/ROLLBACK TO SAVEPOINT smn_presence_detail/);
});
