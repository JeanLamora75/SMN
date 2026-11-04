import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {paletteMigrationBody} from "../scripts/apply-red-purple-migration";

const migration=readFileSync(new URL("../prisma/migrations/20261031_red_purple_palette/migration.sql",import.meta.url),"utf8");
const install=readFileSync(new URL("../src/server/installation/install.ts",import.meta.url),"utf8");
const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8")) as {scripts:Record<string,string>};

test("migration CLI disponible avec check/apply et transaction",()=>{
 assert.equal(pkg.scripts["db:migrate:red-purple"],"tsx scripts/apply-red-purple-migration.ts");
 assert.match(migration,/BEGIN;/);
 assert.match(migration,/COMMIT;/);
 assert.match(paletteMigrationBody(migration),/ADD CONSTRAINT smn_general_settings_palette_check/);
 assert.doesNotMatch(paletteMigrationBody(migration),/^\s*(?:BEGIN|COMMIT);/m);
});
test("installation native v33 intègre Red Purple dans sa baseline autonome",()=>{
 const baseline=readFileSync(new URL("../prisma/baseline/v33/schema.sql",import.meta.url),"utf8");
 assert.ok(install.includes("nativeV33BaselineSql("));
 assert.ok(install.includes('await client.query(sql)'));
 assert.ok(baseline.includes("CHECK (palette IN ('ocean','forest','violet','red-purple'))"));
 assert.ok(install.includes("INSERT INTO public.smn_general_settings(installation_id,palette) VALUES ('singleton','red-purple')"));
});
