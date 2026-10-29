import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {MULTI_TEAM_MIGRATION,MULTI_TEAM_SCHEMA_SQL} from "../src/server/teams/migration";
import {assertMultiTeamMigrationValid,isSupportedAuthenticationSchemaVersion}
 from "../src/server/accounts/migration";

const root=new URL("../",import.meta.url);
const read=(name:string)=>readFileSync(new URL(name,root),"utf8");

test("le SQL référencé par checksum est identique au fichier versionné",()=>{
 assert.equal(MULTI_TEAM_MIGRATION,"20261026_smn282_multi_teams");
 assert.equal(read("prisma/migrations/20261026_smn282_multi_teams/migration.sql").replace(/\r\n/g,"\n"),
  MULTI_TEAM_SCHEMA_SQL.replace(/\r\n/g,"\n"));
});
test("v28 préserve les tables et enregistre la version uniquement à la fin",()=>{
 const sql=MULTI_TEAM_SCHEMA_SQL;
 assert.match(sql,/ALTER TABLE public\.smn_team ALTER COLUMN product_id DROP NOT NULL/);
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS smn_team_product_id_key/);
 assert.match(sql,/smn_team_product_same_installation_fk/);
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS smn_team_installation_name_ci_key/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.smn_team_context_audit/);
 assert.match(sql,/UPDATE public\.smn_installation SET schema_version=28/);
 assert.doesNotMatch(sql,/DELETE FROM public\.smn_(?:team|product)/i);
 assert.doesNotMatch(sql,/DROP TABLE public\.smn_(?:team|product)/i);
});
test("contrat Prisma : équipes multiples et produit facultatif unique",()=>{
 const schema=read("prisma/schema.prisma");
 const product=schema.split("model SmnProduct {")[1].split("\n}")[0];
 const team=schema.split("model SmnTeam {")[1].split("\n}")[0];
 assert.match(product,/installationId String @map\("installation_id"\)/);
 assert.match(product,/team SmnTeam\?/);
 assert.match(team,/installationId String @map\("installation_id"\)/);
 assert.match(team,/productId String\? @unique @map\("product_id"\)/);
 assert.match(team,/product SmnProduct\?/);
});
test("authentification admet v28 uniquement si migration et structure valides",()=>{
 assert.equal(isSupportedAuthenticationSchemaVersion(27),true);
 assert.equal(isSupportedAuthenticationSchemaVersion(28),true);
 assert.equal(isSupportedAuthenticationSchemaVersion(29),true);
 assert.equal(isSupportedAuthenticationSchemaVersion(30),true);
 assert.equal(isSupportedAuthenticationSchemaVersion(31),false);
 assert.doesNotThrow(()=>assertMultiTeamMigrationValid(28,true,true));
 assert.throws(()=>assertMultiTeamMigrationValid(28,false,true),/smn-schema-incompatible/);
 assert.throws(()=>assertMultiTeamMigrationValid(28,true,false),/smn-schema-incompatible/);
});
test("le chemin d'application est manuel et demande une sauvegarde",()=>{
 const runner=read("scripts/apply-multi-team-migration.ts");
 assert.match(runner,/process\.argv\.slice\(2\)\.join\(" "\)!=="--apply"/);
 assert.match(runner,/Usage: pnpm exec tsx scripts\/apply-multi-team-migration\.ts --apply/);
 assert.match(runner,/await db\.query\("BEGIN"\)/);
 assert.match(runner,/await db\.query\("ROLLBACK"\)/);
 assert.match(runner,/classifySnapshot\(await probePostgres\(uri\)\)/);
 const account=read("src/server/accounts/migration.ts");
 assert.doesNotMatch(account,/await client\.query\(MULTI_TEAM_SCHEMA_SQL\)/);
 const probe=read("src/server/db/probe.ts");
 assert.match(probe,/FROM public\._prisma_migrations/);
 assert.doesNotMatch(probe,/FROM public\._prisma_migrations LIMIT\s+\d+/);
});
