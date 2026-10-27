import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {MULTI_TEAM_MIGRATION,MULTI_TEAM_SCHEMA_SQL} from "../src/server/teams/migration";
import {TEAM_AGILE_MIGRATION,TEAM_AGILE_MIGRATION_SQL} from "../src/server/teams/agile-migration";
import {MULTI_TEAM_CONTEXT_READY} from "../src/lib/team-context-readiness";

test("les deux migrations versionnees correspondent exactement aux sources",()=>{
 assert.equal(MULTI_TEAM_MIGRATION,"20261026_smn282_multi_teams");
 assert.equal(TEAM_AGILE_MIGRATION,"20261027_smn288_team_agile_mode");
 assert.equal(readFileSync("prisma/migrations/20261026_smn282_multi_teams/migration.sql","utf8"),MULTI_TEAM_SCHEMA_SQL);
 assert.equal(readFileSync("prisma/migrations/20261027_smn288_team_agile_mode/migration.sql","utf8"),TEAM_AGILE_MIGRATION_SQL);
});
test("le verrou de diffusion multi-equipes demeure ferme avant recette",()=>{
 assert.equal(MULTI_TEAM_CONTEXT_READY,false);
});
test("les scripts de migration exigent une action explicite et une sauvegarde",()=>{
 for(const file of ["scripts/apply-multi-team-migration.ts","scripts/apply-team-agile-migration.ts"]){
  const source=readFileSync(file,"utf8");
  assert.match(source,/--apply/,file);
  assert.match(source,/--backup-file=/,file);
  assert.match(source,/ROLLBACK/,file);
  assert.match(source,/schema_version/,file);
 }
});

test("le diagnostic inclut les migrations v28 et v29",()=>{
 const source=readFileSync("src/server/installation/diagnostic.ts","utf8");
 assert.ok(source.includes("snapshot.multiTeamSchemaValid"));
 assert.ok(source.includes("snapshot.teamAgileSchemaValid"));
 assert.ok(source.includes("TEAM_AGILE_MIGRATION_SQL"));
});
