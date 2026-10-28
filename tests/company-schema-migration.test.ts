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
