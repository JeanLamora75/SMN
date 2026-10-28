import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const sql=readFileSync(new URL("../prisma/migrations/20261028_smn316_company_catalog/migration.sql",import.meta.url),"utf8");
test("migration interdit les fermetures historiques",()=>{
 assert.match(sql,/count\(\*\) FROM public\.smn_company_closure\)/);
 assert.match(sql,/count\(\*\) FROM public\.smn_company_closure_history\)/);
});
test("association membre facultative, isolation installation",()=>{
 assert.match(sql,/ADD COLUMN company_id text;/);
 assert.match(sql,/FOREIGN KEY \(installation_id,company_id\)/);
});
test("fermeture par entreprise uniquement",()=>{
 assert.match(sql,/DROP COLUMN team_id/);
 assert.match(sql,/ALTER COLUMN company_id SET NOT NULL/);
});
test("mise à niveau versionnée",()=>assert.match(sql,/schema_version=31/));

test("index hérité supprimé explicitement",()=>{
 assert.match(sql,/DROP INDEX IF EXISTS public\.smn_company_closure_team_dates_idx/);
});
test("aucun lancement automatique de migration",()=>{
 const runner=readFileSync(new URL("../scripts/apply-company-schema-migration.ts",import.meta.url),"utf8");
 assert.match(runner,/--apply/);
 assert.match(runner,/ROLLBACK/);
 assert.match(runner,/Journal des 30 migrations non conforme/);
});

test("migration refuse tout jeu de fermetures ou historique non vide",()=>{
 assert.match(sql,/RAISE EXCEPTION 'Existing company closures\/history/);
 assert.match(sql,/Expected initialized installation schema v30/);
});
test("identité entreprise isolée au sein de l'installation",()=>{
 assert.match(sql,/UNIQUE \(installation_id,id\)/);
 assert.match(sql,/smn_company_installation_name_uq/);
 assert.match(sql,/CHECK \(color IN/);
});
test("références membre et fermeture sont restrictives",()=>{
 assert.match(sql,/smn_member_company_same_installation_fk/);
 assert.match(sql,/smn_closure_company_fk/);
 assert.match(sql,/ON DELETE RESTRICT/);
});
test("diagnostic inclut la version 31 et valide son empreinte",()=>{
 const source=readFileSync(new URL("../src/server/installation/diagnostic.ts",import.meta.url),"utf8");
 assert.match(source,/schema_version>=31/);
 assert.match(source,/company\.checksum!==createHash/);
 assert.match(source,/snapshot\.companySchemaValid/);
});
