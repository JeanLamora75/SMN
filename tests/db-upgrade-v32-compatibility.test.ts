import {test} from "node:test";
import {strict as assert} from "node:assert";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {decideUpgrade} from "../scripts/db-upgrade-policy";
import {verifyHistory} from "../scripts/db-migration-history";

test("v31 saine seule autorisée à migrer",()=>{
 assert.equal(decideUpgrade("initialized",31,31).kind,"migrate");
 for(const version of [27,28,29,30,33])assert.equal(decideUpgrade("initialized",version,version).kind,"refuse");
});
test("v32 saine idempotente, historique erroné bloqué",()=>{
 assert.equal(decideUpgrade("initialized",32,32).kind,"noop");
 assert.equal(decideUpgrade("initialized",32,31).kind,"refuse");
 assert.equal(decideUpgrade("initialized",31,32).kind,"refuse");
});
test("états dangereux toujours bloqués",()=>{
 for(const state of ["installation-incomplete","schema-incompatible","connection-error","virgin"])
  assert.equal(decideUpgrade(state,31,31).kind,"refuse");
});
test("historique SQL valide et divergence détectée",()=>{
 const src=new Map([["migration","SELECT 1;"]]);
 const row={migration_name:"migration",checksum:createHash("sha256").update("SELECT 1;").digest("hex"),
  finished_at:new Date(),rolled_back_at:null};
 assert.deepEqual(verifyHistory([row],src),[]);
 assert(verifyHistory([{...row,checksum:"bad"}],src).some(e=>e.includes("Checksum")));
 assert(verifyHistory([row,row],src).some(e=>e.includes("double")));
 assert(verifyHistory([] ,src).some(e=>e.includes("non appliquée")));
 assert(verifyHistory([{...row,finished_at:null}],src).some(e=>e.includes("non terminée")));
});

test("migration v32 non destructive et contrôlée",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql",import.meta.url),"utf8");
 assert.match(sql,/schema_version\s*=\s*32/i);
 assert.match(sql,/schema_version\s*=\s*31/i);
 assert.match(sql,/agile_mode/i);
 assert.match(sql,/is_archived/i);
 assert.doesNotMatch(sql,/\b(?:DROP|TRUNCATE)\s+(?:TABLE|SCHEMA|DATABASE)\b/i);
});
test("refus historique inconnu et version absente",()=>{
 assert.equal(decideUpgrade("initialized",undefined,undefined).kind,"refuse");
 assert.equal(decideUpgrade("initialized",31,undefined).kind,"refuse");
 assert.equal(decideUpgrade("initialized",undefined,31).kind,"refuse");
});
test("historique manquant et non réconcilié",()=>{
 const row={migration_name:"orphan",checksum:"abc",finished_at:new Date(),rolled_back_at:null};
 assert(verifyHistory([row],new Map()).some(e=>e.includes("introuvable")));
 assert(verifyHistory([{...row,rolled_back_at:new Date()}],new Map()).some(e=>e.includes("non terminée")));
});
