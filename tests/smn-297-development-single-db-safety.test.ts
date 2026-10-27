import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MULTI_TEAM_CONTEXT_READY} from "../src/lib/team-context-readiness";

test("la diffusion multiéquipes demeure désactivée avant recette",()=>{
 assert.equal(MULTI_TEAM_CONTEXT_READY,false);
});
test("les migrations manuelles nécessitent une cible de répétition explicite",()=>{
 for(const path of ["scripts/apply-multi-team-migration.ts","scripts/apply-team-agile-migration.ts"]){
  const source=readFileSync(path,"utf8");
  assert.ok(source.includes("--rehearsal"),path);
  assert.ok(source.includes("rehearsalMigrationUri("),path);
  assert.ok(source.includes("process.env.SMN_REHEARSAL_DATABASE_URL"),path);
 }
});
test("sélection d'équipe réservée à l'admin et refus de l'archive v29",()=>{
 const source=readFileSync("src/server/teams/active.ts","utf8");
 assert.ok(source.includes("a.role='admin'"));
 assert.ok(source.includes("installation.schemaVersion!==28&&installation.schemaVersion!==29"));
 assert.ok(source.includes("is_archived=false"));
});
